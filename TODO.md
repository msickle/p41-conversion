# TODO List

## Known Issues

### Pause function does not pause everything
- **Issue**:  Paratroopers will still spawn during a pause. Need to scan all game objects for extra pause handling.

### Air Debris Empty Frames
- **Issue**: Some air debris pieces show as black squares with diagonal lines
- **Cause**: Some frames in the spritesheet may be empty or frame selection is slightly off
- **Status**: Minor visual issue, deferred
- **Notes**: Most debris shows correctly, only occasional empty frames

### Score collected but not displayed
- **Issue**: addToScore() is called and collecting score but it never displays
- **Issue**: addToScore() gets NaN error when paratroopers hit the deck

### Audio Context Warning
- **Issue**: Browser console shows repeated warnings about AudioContext not being allowed to start without user gesture
- **Error Message**: `The AudioContext was not allowed to start. It must be resumed (or created) after a user gesture on the page.`
- **Status**: Deferred for later investigation
- **Notes**: This is a browser security feature. The game functions normally, but the console warnings are persistent. Need to implement a proper solution that doesn't interfere with game loading.
