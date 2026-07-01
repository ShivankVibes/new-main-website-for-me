import Foundation
import Cocoa
import ApplicationServices

// Set stdout to unbuffered so messages are sent to Node.js immediately
setvbuf(stdout, nil, _IONBF, 0)

// Helper to press a standard key code
func postKeyEvent(key: CGKeyCode, down: Bool, flags: CGEventFlags = []) {
    let source = CGEventSource(stateID: .hidSystemState)
    let event = CGEvent(keyboardEventSource: source, virtualKey: key, keyDown: down)
    event?.flags = flags
    event?.post(tap: .cghidEventTap)
}

// Helper to press a media key or special system key using systemDefined subtype 8
func postSystemDefinedKey(key: Int32, down: Bool) {
    let stateInt = down ? 0xa : 0xb // 0xa = key down, 0xb = key up
    let keyInt = Int(key)
    let data1 = (keyInt << 16) | (stateInt << 8)
    
    // Subtype 8 is used for media keys (volume, play/pause, brightness, etc.)
    let event = NSEvent.otherEvent(with: .systemDefined,
                                   location: NSPoint.zero,
                                   modifierFlags: NSEvent.ModifierFlags(rawValue: down ? 0xa00 : 0xb00),
                                   timestamp: 0,
                                   windowNumber: 0,
                                   context: nil,
                                   subtype: 8,
                                   data1: data1,
                                   data2: -1)
    
    event?.cgEvent?.post(tap: .cghidEventTap)
}

// Check accessibility permission status
func checkAccessibility() -> Bool {
    return AXIsProcessTrusted()
}

print("INIT_SUCCESS")

while let line = readLine() {
    let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)
    if trimmed.isEmpty { continue }
    
    let parts = trimmed.split(separator: " ")
    if parts.isEmpty { continue }
    let cmd = parts[0]
    
    switch cmd {
    case "check_accessibility":
        print("ACCESSIBILITY: \(checkAccessibility())")
        
    case "move":
        // move <dx> <dy>
        if parts.count >= 3, let dx = Double(parts[1]), let dy = Double(parts[2]) {
            let source = CGEventSource(stateID: .hidSystemState)
            if let event = CGEvent(source: source) {
                let currentPos = event.location
                let newPos = CGPoint(x: currentPos.x + CGFloat(dx), y: currentPos.y + CGFloat(dy))
                let moveEvent = CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: newPos, mouseButton: .left)
                moveEvent?.post(tap: .cghidEventTap)
            }
        }
        
    case "move_to":
        // move_to <x> <y>
        if parts.count >= 3, let x = Double(parts[1]), let y = Double(parts[2]) {
            let source = CGEventSource(stateID: .hidSystemState)
            let moveEvent = CGEvent(mouseEventSource: source, mouseType: .mouseMoved, mouseCursorPosition: CGPoint(x: CGFloat(x), y: CGFloat(y)), mouseButton: .left)
            moveEvent?.post(tap: .cghidEventTap)
        }
        
    case "click":
        // click <left|right|middle> [down|up|press]
        if parts.count >= 2 {
            let button = parts[1]
            let action = parts.count >= 3 ? parts[2] : "press"
            let source = CGEventSource(stateID: .hidSystemState)
            let pos = CGEvent(source: source)?.location ?? CGPoint.zero
            
            var downType: CGEventType = .leftMouseDown
            var upType: CGEventType = .leftMouseUp
            var cgButton: CGMouseButton = .left
            
            if button == "right" {
                downType = .rightMouseDown
                upType = .rightMouseUp
                cgButton = .right
            } else if button == "middle" {
                downType = .otherMouseDown
                upType = .otherMouseUp
                cgButton = .center
            }
            
            if action == "down" || action == "press" {
                let clickDown = CGEvent(mouseEventSource: source, mouseType: downType, mouseCursorPosition: pos, mouseButton: cgButton)
                clickDown?.post(tap: .cghidEventTap)
            }
            if action == "up" || action == "press" {
                let clickUp = CGEvent(mouseEventSource: source, mouseType: upType, mouseCursorPosition: pos, mouseButton: cgButton)
                clickUp?.post(tap: .cghidEventTap)
            }
        }
        
    case "scroll":
        // scroll <dx> <dy>
        if parts.count >= 3, let dx = Int32(parts[1]), let dy = Int32(parts[2]) {
            let source = CGEventSource(stateID: .hidSystemState)
            // Units pixel scrolling is smooth. Note: dy is vertical, dx is horizontal scroll.
            let scroll = CGEvent(scrollWheelEvent2Source: source, units: .pixel, wheelCount: 2, wheel1: dy, wheel2: dx, wheel3: 0)
            scroll?.post(tap: .cghidEventTap)
        }
        
    case "key":
        // key <keycode> <down|up|press> [modifiers]
        if parts.count >= 3, let keycode = CGKeyCode(parts[1]) {
            let action = parts[2]
            var flags = CGEventFlags()
            
            if parts.count >= 4 {
                let modifiers = parts[3].split(separator: ",")
                for mod in modifiers {
                    if mod == "cmd" { flags.insert(.maskCommand) }
                    else if mod == "shift" { flags.insert(.maskShift) }
                    else if mod == "opt" { flags.insert(.maskAlternate) }
                    else if mod == "ctrl" { flags.insert(.maskControl) }
                }
            }
            
            if action == "down" || action == "press" {
                postKeyEvent(key: keycode, down: true, flags: flags)
            }
            if action == "up" || action == "press" {
                postKeyEvent(key: keycode, down: false, flags: flags)
            }
        }
        
    case "media_key":
        // media_key <play|next|prev|vol_up|vol_down|mute|brightness_up|brightness_down> [down|up|press]
        if parts.count >= 2 {
            let keyStr = parts[1]
            let action = parts.count >= 3 ? parts[2] : "press"
            
            var keyVal: Int32 = -1
            if keyStr == "play" { keyVal = 16 }
            else if keyStr == "next" { keyVal = 17 }
            else if keyStr == "prev" { keyVal = 18 }
            else if keyStr == "vol_up" { keyVal = 0 }
            else if keyStr == "vol_down" { keyVal = 1 }
            else if keyStr == "mute" { keyVal = 7 }
            else if keyStr == "brightness_up" { keyVal = 2 }
            else if keyStr == "brightness_down" { keyVal = 3 }
            
            if keyVal != -1 {
                if action == "down" || action == "press" {
                    postSystemDefinedKey(key: keyVal, down: true)
                }
                if action == "up" || action == "press" {
                    postSystemDefinedKey(key: keyVal, down: false)
                }
            }
        }
        
    case "type":
        // type <text>
        if parts.count >= 2 {
            // Join everything after parts[0] back into a string
            let text = parts[1...].joined(separator: " ")
            let source = CGEventSource(stateID: .hidSystemState)
            
            if let keyEvent = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: true) {
                var utf16Chars = Array(text.utf16)
                keyEvent.keyboardSetUnicodeString(stringLength: utf16Chars.count, unicodeString: &utf16Chars)
                keyEvent.post(tap: .cghidEventTap)
            }
            if let keyUpEvent = CGEvent(keyboardEventSource: source, virtualKey: 0, keyDown: false) {
                keyUpEvent.post(tap: .cghidEventTap)
            }
        }
        
    default:
        print("UNKNOWN_COMMAND: \(cmd)")
    }
}
