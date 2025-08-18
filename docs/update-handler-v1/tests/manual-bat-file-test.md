# Test `start-vivaldi-monitor.bat` manually

## Steps

Follow these steps to test the `start-vivaldi-monitor.bat` file locally:

1. Close Vivaldi
2. Decrement current Vivaldi version number to a previous Vivaldi version number. For example:
   - Decrement `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.58"` to `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.56"`
3. Run `./scripts/update-handler/start-vivaldi-monitor.bat` in the project's root directory to start watching for Vivaldi version changes. (A window entitled `C\Program Files\nodejs\node.exe` should flash briefly on the screen, then minimizes to the Taskbar.)
4. Verify the monitor is watching for version changes:

   1. With Task Manager (`ctrl + shift + esc`)

      - Search for `node.exe`
        - Search result > Processes:
          - `Nodejs JavaScript Runtime`
            - -> `C\Program Files\nodejs\node.exe`

   2. Open the `C\Program Files\nodejs\node.exe` window:
      ```cmd
      🚀 Starting Vivaldi Update Monitor...
      🔍 Initial Vivaldi version: 7.5.3735.56
      👀 Monitoring Vivaldi updates at: C:/Users/johnj/AppData/Local/Vivaldi/Application
      ✅ Vivaldi monitor started
      🚀 Vivaldi monitor is running. Press Ctrl+C to stop.
      📍 Monitoring: C:/Users/johnj/AppData/Local/Vivaldi/Application
      📊 Current version: 7.5.3735.56
      ```

5. Increment the previous Vivaldi version number (in Step 2 above) back to the version number Vivaldi's actually using. This should:
   - start the Notification server (`scripts/update-handler/notification-server.js`)
   - open Vivaldi with the `notifications/user-notification.html` file in the active tab, and
   - update the `C\Program Files\nodejs\node.exe` window log to read:
     ```cmd
     🚀 Starting Vivaldi Update Monitor...
     🔍 Initial Vivaldi version: 7.5.3735.56
     👀 Monitoring Vivaldi updates at: C:/Users/johnj/AppData/Local/Vivaldi/Application
     ✅ Vivaldi monitor started
     🚀 Vivaldi monitor is running. Press Ctrl+C to stop.
     📍 Monitoring: C:/Users/johnj/AppData/Local/Vivaldi/Application
     📊 Current version: 7.5.3735.56
     📁 Detected potential version change: 7.5.3735.56
     📁 Detected potential version change: 7.5.3735.58
     🚨 Vivaldi Update Detected: 7.5.3735.56 → 7.5.3735.58
     🚨 Vivaldi Update Detected!
       Version: 7.5.3735.56 → 7.5.3735.58
     🔧 Notification server started for HTML communication
     📢 Displaying accessible update notification...
       Previous version: 7.5.3735.56
       Current version: 7.5.3735.58
     📝 Updated notification with version info: 7.5.3735.56 → 7.5.3735.58
     🌐 Opening notification in Vivaldi (as tab)...
       File: C:\Users\johnj\OneDrive\SEE_VIVALDI\see-vivaldi\notifications\user-notification.html
     ✅ Notification opened as tab in Vivaldi
     🔧 Notification server running on http://localhost:3842
     ```
6. Click `Auto-Deploy Now` button in the the `user-notification.html` tab. This should:
   - close Vivaldi,
   - pause for several seconds,
   - restart Vivaldi,
   - change the name of the tab on your Windows Taskbar from `C\Program Files\nodejs\node.exe` to `webpack`, and
   - update the log in the `webpack` window to read:
     ```cmd
     🚀 Starting Vivaldi Update Monitor...
     🔍 Initial Vivaldi version: 7.5.3735.56
     👀 Monitoring Vivaldi updates at: C:/Users/johnj/AppData/Local/Vivaldi/Application
     ✅ Vivaldi monitor started
     🚀 Vivaldi monitor is running. Press Ctrl+C to stop.
     📍 Monitoring: C:/Users/johnj/AppData/Local/Vivaldi/Application
     📊 Current version: 7.5.3735.56
     📁 Detected potential version change: 7.5.3735.56
     📁 Detected potential version change: 7.5.3735.58
     🚨 Vivaldi Update Detected: 7.5.3735.56 → 7.5.3735.58
     🚨 Vivaldi Update Detected!
       Version: 7.5.3735.56 → 7.5.3735.58
     🔧 Notification server started for HTML communication
     📢 Displaying accessible update notification...
       Previous version: 7.5.3735.56
       Current version: 7.5.3735.58
     📝 Updated notification with version info: 7.5.3735.56 → 7.5.3735.58
     🌐 Opening notification in Vivaldi (as tab)...
       File: C:\Users\johnj\OneDrive\SEE_VIVALDI\see-vivaldi\notifications\user-notification.html
     ✅ Notification opened as tab in Vivaldi
     🔧 Notification server running on http://localhost:3842
     🚀 Starting full auto-deployment...
     📦 Step 1: Building and deploying...
     🔨 Running npm run build...
     ✅ Build completed successfully
     🔄 Step 2: Closing Vivaldi...
     🔄 Closing Vivaldi...
     ✅ Vivaldi closed successfully
     ⏳ Step 3: Waiting before restart...
     🚀 Step 4: Restarting Vivaldi...
     🚀 Restarting Vivaldi...
     🔍 Found Vivaldi at: C:/Users/johnj/AppData/Local/Vivaldi/Application/vivaldi.exe
     ✅ Vivaldi restart initiated
     ✅ Full auto-deployment completed successfully!
     ```
7. Manually verify `src/scripts/` functionality
   - [x] Code works as expected
8. Close the `webpack` window to terminate the test process
9. Verify that the test process has been terminated:
   - Open Task Manager (`ctrl + shift + esc`)
     - Search for `node.exe`
       - Search result > Processes: "No filter results"
