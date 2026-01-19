/**
 * Example: Reading a Delta table from Azure ADLS Gen2
 *
 * This example demonstrates how to read a Delta table stored in Azure Data Lake Storage Gen2.
 *
 * Supported URI formats:
 * - abfs://[container]@[account].dfs.core.windows.net/[path]
 * - abfss://[container]@[account].dfs.core.windows.net/[path] (secure)
 * - az://[container]/[path]
 * - adl://[container]/[path]
 *
 * Authentication options:
 * 1. Storage Account Key
 * 2. SAS Token
 * 3. Service Principal (Client Secret)
 * 4. Azure CLI
 */

import { DeltaTable } from "../delta/index.js";

// Replace with your Azure storage account details
const storageAccountName = "your-storage-account";
const containerName = "your-container";
const tablePath = "path/to/delta/table";

// Example 1: Using Storage Account Key
async function readWithAccountKey() {
  const tableUri = `abfss://${containerName}@${storageAccountName}.dfs.core.windows.net/${tablePath}`;

  const table = new DeltaTable(tableUri, {
    storageOptions: {
      azureStorageAccountName: storageAccountName,
      azureStorageAccountKey: "your-storage-account-key",
    },
  });

  await table.load();
  console.log("Table version:", table.version());
  console.log("Table metadata:", table.metadata());
}

// Example 2: Using SAS Token
async function readWithSasToken() {
  const tableUri = `abfss://${containerName}@${storageAccountName}.dfs.core.windows.net/${tablePath}`;

  const table = new DeltaTable(tableUri, {
    storageOptions: {
      azureStorageAccountName: storageAccountName,
      azureStorageSasKey: "your-sas-token",
    },
  });

  await table.load();
  console.log("Table version:", table.version());
}

// Example 3: Using Service Principal
async function readWithServicePrincipal() {
  const tableUri = `abfss://${containerName}@${storageAccountName}.dfs.core.windows.net/${tablePath}`;

  const table = new DeltaTable(tableUri, {
    storageOptions: {
      azureStorageAccountName: storageAccountName,
      azureClientId: "your-client-id",
      azureClientSecret: "your-client-secret",
      azureTenantId: "your-tenant-id",
    },
  });

  await table.load();
  console.log("Table version:", table.version());
}

// Example 4: Using Azure CLI authentication
async function readWithAzureCli() {
  const tableUri = `abfss://${containerName}@${storageAccountName}.dfs.core.windows.net/${tablePath}`;

  const table = new DeltaTable(tableUri, {
    storageOptions: {
      azureStorageAccountName: storageAccountName,
      azureUseAzureCli: true,
    },
  });

  await table.load();
  console.log("Table version:", table.version());
}

// Run one of the examples (uncomment the one you want to test)
// readWithAccountKey().catch(console.error);
// readWithSasToken().catch(console.error);
// readWithServicePrincipal().catch(console.error);
// readWithAzureCli().catch(console.error);

console.log("Azure ADLS Gen2 example - Update the credentials and uncomment a function to run.");
