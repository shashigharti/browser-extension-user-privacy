/**
 * Monitors active dwell time of all opened/activated tabs
 * Reference: https://github.com/mozilla/jestr-pioneer-shield-study
 */
 export class ActiveTabDwellTimeMonitor {
    private tabActiveDwellTimes = {};
    private interval = 0;
  
    public run() {
      // checks what is the current tabId every interval and attributes the interval length of dwell time to that tab
      const intervalMs = 250; 
      
    }
  }
  