// Reference: https://github.com/mozilla/jestr-pioneer-shield-study

import { ActiveTabDwellTimeMonitor } from "./ActiveTabDwellTimeMonitor";
// Export active dwell time monitor singleton
// (used to annotate received tab-relevant data packets)
export const activeTabDwellTimeMonitor = new ActiveTabDwellTimeMonitor();