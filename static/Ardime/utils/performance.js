import * as Constants from "./constants.js";

class Performance {
    constructor() {
        this.m_startTime = new Date().getTime();
        this.m_elapsedTime = undefined;
    }

    start() {
        this.m_startTime = new Date().getTime();
    }

    stop() {
        this.m_elapsedTime = new Date().getTime() - this.m_startTime;
        return this.m_elapsedTime;
    }

    getElapsedTime(_type) {
        switch(_type) {
            case Constants.Time.Millisec:
                return this.m_elapsedTime;
            case Constants.Time.Seconds:
                return this.m_elapsedTime / 1000;
            case Constants.Time.Minutes:
                return this.m_elapsedTime / 60_000;
            case Constants.Time.Hours:
                return this.m_elapsedTime / 3.6e6;
            
            default:
                return this.m_elapsedTime;
        }
    }
}

export default Performance;