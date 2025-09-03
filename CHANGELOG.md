# Changelog

## [v1.0.0] - 2025-09-03

### Added
- Customizable bar display for any scalar topic (not just battery)
- Configurable min/max values for percentage calculation
- Support for custom hex color codes with visual color picker
- Horizontal and vertical orientation options
- Automatic field detection for nested message structures
- Two fill behaviors: Clamp (show min/max when out of range) and Ignore (show zero when out of range)
- Value negation option to invert input values
- Real-time response without animation lag for fast oscillating data
- Automatic resizing with panel dimensions
- Support for deeply nested fields (e.g., `pose.position.x`, `sensor.readings.temperature`)