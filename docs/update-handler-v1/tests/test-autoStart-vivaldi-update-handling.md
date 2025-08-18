# Test: Start Vivaldi Update Handling when Windows loads

## Steps

Follow these steps to automatically detect and handle Vivaldi updates when Windows starts:

1. Copy `scripts/start-vivaldi-monitor.bat` to `"C:\Users\johnj\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\start-vivaldi-monitor.bat"`
2. Rename `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.58"` to `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.56"`
3. Restart Windows:
   - Wait for about ~30 seconds
   - A window entitled `C\Program Files\nodejs\node.exe` flashes briefly on the screen, then minimizes to the Taskbar.
4. Open Task Manager (`ctrl + shift + esc`)
   - Search for `node.exe`
     - Search result > Processes:
       - `Nodejs JavaScript Runtime`
         - -> `C\Program Files\nodejs\node.exe`
5. Open the `C\Program Files\nodejs\node.exe` window:
   ```cmd
   🚀 Starting Vivaldi Update Monitor...
   🔍 Initial Vivaldi version: 7.5.3735.56
   👀 Monitoring Vivaldi updates at: C:/Users/johnj/AppData/Local/Vivaldi/Application
   ✅ Vivaldi monitor started
   🚀 Vivaldi monitor is running. Press Ctrl+C to stop.
   📍 Monitoring: C:/Users/johnj/AppData/Local/Vivaldi/Application
   📊 Current version: 7.5.3735.56
   ```
6. Rename `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.56"` to `"C:\Users\johnj\AppData\Local\Vivaldi\Application\7.5.3735.58"`
   - Vivaldi opens with `file:///C:/Users/johnj/OneDrive/SEE_VIVALDI/see-vivaldi/notifications/user-notification.html` as the active tab
   - The `C\Program Files\nodejs\node.exe` window log now reads:
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
7. Click `Auto-Deploy Now` button
   - Vivaldi closes
   - Wait several seconds
   - Vivaldi restarts
   - The `C\Program Files\nodejs\node.exe` window log now reads:
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
8. Open Task Manager (`ctrl + shift + esc`)
   - Search for `node.exe`
     - Search result > Processes:
       - `Nodejs JavaScript Runtime`
         - -> `webpack`
9. Manually verify `src/scripts/` functionality
   - [x] Code works as expected
