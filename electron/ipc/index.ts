import { ipcMain, dialog, app, shell } from 'electron';
import path from 'path';
import { getDb } from '../db';

const db = getDb();

ipcMain.handle('projects:list', () => db.listProjects());
ipcMain.handle('projects:create', (_e, data) => db.createProject(data));
ipcMain.handle('projects:update', (_e, id, data) => db.updateProject(id, data));
ipcMain.handle('projects:delete', (_e, id) => db.deleteProject(id));
ipcMain.handle('projects:setActive', (_e, id) => db.setActiveProject(id));
ipcMain.handle('projects:getActive', () => db.getActiveProject());

ipcMain.handle('phases:list', () => db.listPhases());
ipcMain.handle('phases:create', (_e, name) => db.createPhase(name));
ipcMain.handle('phases:update', (_e, id, name) => db.updatePhase(id, name));
ipcMain.handle('phases:delete', (_e, id) => db.deletePhase(id));
ipcMain.handle('phases:reorder', (_e, order) => db.reorderPhases(order));
ipcMain.handle('subphases:create', (_e, phaseId, name) => db.createSubphase(phaseId, name));
ipcMain.handle('subphases:update', (_e, id, name) => db.updateSubphase(id, name));
ipcMain.handle('subphases:delete', (_e, id) => db.deleteSubphase(id));
ipcMain.handle('subphases:list', (_e, phaseId) => db.listSubphases(phaseId));

ipcMain.handle('contractors:list', () => db.listContractors());
ipcMain.handle('contractors:create', (_e, data) => db.createContractor(data));
ipcMain.handle('contractors:update', (_e, id, data) => db.updateContractor(id, data));
ipcMain.handle('contractors:delete', (_e, id) => db.deleteContractor(id));

ipcMain.handle('costs:list', (_e, filters) => db.listCosts(filters));
ipcMain.handle('costs:create', (_e, data) => db.createCost(data));
ipcMain.handle('costs:update', (_e, id, data) => db.updateCost(id, data));
ipcMain.handle('costs:delete', (_e, id) => db.deleteCost(id));

ipcMain.handle('documents:attach', async (_e, { projectId, costId, filePath }) => {
  const { storedName, targetPath, size } = await db.saveDocumentFile(filePath);
  const doc = await db.attachDocument({
    project_id: projectId,
    cost_id: costId,
    original_name: path.basename(filePath),
    stored_name: storedName,
    stored_path: targetPath,
    mime: 'application/pdf',
    size,
  });
  return doc;
});

ipcMain.handle('documents:listByProject', (_e, projectId) => db.listDocuments(projectId));
ipcMain.handle('documents:open', (_e, storedPath) => shell.openPath(storedPath));
ipcMain.handle('documents:delete', (_e, id) => db.deleteDocument(id));

ipcMain.handle('export:csv', (_e, projectId) => db.exportCostsCsv(projectId));
ipcMain.handle('import:csv', (_e, csv) => db.importCostsCsv(csv));

ipcMain.handle('export:backup', async () => {
  const { filePath } = await dialog.showSaveDialog({
    title: 'Shrani varnostno kopijo',
    defaultPath: path.join(app.getPath('documents'), 'gradnja-backup.zip'),
    filters: [{ name: 'ZIP', extensions: ['zip'] }],
  });
  if (!filePath) return null;
  return db.exportBackup(filePath);
});

ipcMain.handle('import:backup', async () => {
  const { filePaths } = await dialog.showOpenDialog({
    title: 'Uvozi varnostno kopijo',
    filters: [{ name: 'ZIP', extensions: ['zip'] }],
    properties: ['openFile'],
  });
  if (!filePaths?.length) return null;
  await db.importBackup(filePaths[0]);
  return true;
});
