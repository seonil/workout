# Cloud Import Duplicate Check

This guide describes how to verify that importing workout data from the cloud does not introduce duplicate records.

## Manual steps
1. Open the app in a browser and log in.
2. Open the developer console (F12) and get the data manager instance:
   ```javascript
   const dm = window.workoutDataManager; // or the variable used in your page
   ```
3. Check the current number of workout records and store it for later:
   ```javascript
   const before = dm.getData('workoutHistory').length;
   ```
4. Import from the cloud:
   ```javascript
   await dm.importFromCloud();
   ```
5. Run the uniqueness check:
   ```javascript
   const history = dm.getData('workoutHistory');
   const keys = new Set(history.map(r => r.id || (r.name + r.date + r.setNumber)));
   console.log('No duplicates:', keys.size === history.length);
   ```
6. Re-run the import command in step 4. The record count should remain the same and the uniqueness check should continue to print `true`.

If all checks pass, cloud imports are not creating duplicate workout records.
