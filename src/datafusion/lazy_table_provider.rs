use std::any::Any;
use std::borrow::Cow;
use std::sync::Arc;

use arrow_schema::Schema as ArrowSchema;
use datafusion::logical_expr::utils::conjunction;
use datafusion::physical_expr::execution_props::ExecutionProps;
use datafusion::physical_expr::{create_physical_expr, PhysicalExpr};
use datafusion::physical_plan::filter::FilterExec;
use datafusion::physical_plan::limit::GlobalLimitExec;
use datafusion::physical_plan::memory::{LazyBatchGenerator, LazyMemoryExec};
use datafusion::physical_plan::projection::ProjectionExec;
use datafusion::physical_plan::{ExecutionPlan, Statistics};
use deltalake::datafusion::catalog::{Session, TableProvider};
use deltalake::datafusion::common::{Column, DFSchema, Result as DataFusionResult};
use deltalake::datafusion::datasource::TableType;
use deltalake::datafusion::logical_expr::{LogicalPlan, TableProviderFilterPushDown};
use deltalake::datafusion::prelude::Expr;
use deltalake::{datafusion, DeltaResult, DeltaTableError};
use parking_lot::RwLock;

#[derive(Debug)]
pub(crate) struct LazyTableProvider {
  schema: Arc<ArrowSchema>,
  batches: Vec<Arc<RwLock<dyn LazyBatchGenerator>>>,
}

impl LazyTableProvider {
  /// Build a DeltaTableProvider
  pub fn try_new(
    schema: Arc<ArrowSchema>,
    batches: Vec<Arc<RwLock<dyn LazyBatchGenerator>>>,
  ) -> DeltaResult<Self> {
    Ok(LazyTableProvider { schema, batches })
  }
}

#[async_trait::async_trait]
impl TableProvider for LazyTableProvider {
  fn as_any(&self) -> &dyn Any {
    self
  }

  fn schema(&self) -> Arc<ArrowSchema> {
    self.schema.clone()
  }

  fn table_type(&self) -> TableType {
    TableType::Base
  }

  fn get_table_definition(&self) -> Option<&str> {
    None
  }

  fn get_logical_plan(&self) -> Option<Cow<'_, LogicalPlan>> {
    None
  }

  async fn scan(
    &self,
    _session: &dyn Session,
    projection: Option<&Vec<usize>>,
    filters: &[Expr],
    limit: Option<usize>,
  ) -> DataFusionResult<Arc<dyn ExecutionPlan>> {
    let mut plan: Arc<dyn ExecutionPlan> = Arc::new(LazyMemoryExec::try_new(
      self.schema(),
      self.batches.clone(),
    )?);

    let df_schema: DFSchema = plan.schema().try_into()?;

    if let Some(filter_expr) = conjunction(filters.iter().cloned()) {
      let physical_expr = create_physical_expr(&filter_expr, &df_schema, &ExecutionProps::new())?;
      plan = Arc::new(FilterExec::try_new(physical_expr, plan)?);
    }

    if let Some(projection) = projection {
      let current_projection = (0..plan.schema().fields().len()).collect::<Vec<usize>>();
      if projection != &current_projection {
        let execution_props = &ExecutionProps::new();
        let fields: DeltaResult<Vec<(Arc<dyn PhysicalExpr>, String)>> = projection
          .iter()
          .map(|i| {
            let (table_ref, field) = df_schema.qualified_field(*i);
            create_physical_expr(
              &Expr::Column(Column::from((table_ref, field))),
              &df_schema,
              execution_props,
            )
            .map(|expr| (expr, field.name().clone()))
            .map_err(DeltaTableError::from)
          })
          .collect();
        plan = Arc::new(ProjectionExec::try_new(fields?, plan)?);
      }
    }

    if let Some(limit) = limit {
      plan = Arc::new(GlobalLimitExec::new(plan, 0, Some(limit)))
    };

    Ok(plan)
  }

  fn supports_filters_pushdown(
    &self,
    filter: &[&Expr],
  ) -> DataFusionResult<Vec<TableProviderFilterPushDown>> {
    Ok(vec![TableProviderFilterPushDown::Inexact; filter.len()])
  }

  fn statistics(&self) -> Option<Statistics> {
    None
  }
}
