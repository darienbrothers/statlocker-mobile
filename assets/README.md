# StatLocker Mobile Assets

This directory contains all the visual assets for the StatLocker mobile application.

## Required Assets

### App Icons
- `icon.png` - Main app icon (1024x1024px)
- `adaptive-icon.png` - Android adaptive icon foreground (1024x1024px)
- `favicon.png` - Web favicon (32x32px or 16x16px)

### Splash Screen
- `splash.png` - App splash screen (1284x2778px for iPhone 12 Pro Max)

### Notifications
- `notification-icon.png` - Notification icon (96x96px)

## Asset Specifications

### App Icon (`icon.png`)
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Design**: StatLocker logo on Royal Blue (#0047AB) background
- **Usage**: iOS App Store, Android Play Store, Expo development

### Adaptive Icon (`adaptive-icon.png`)
- **Size**: 1024x1024px
- **Format**: PNG with transparency
- **Design**: StatLocker logo (foreground only)
- **Safe Area**: Keep important elements within 264x264px center
- **Usage**: Android adaptive icons

### Splash Screen (`splash.png`)
- **Size**: 1284x2778px (iPhone 12 Pro Max resolution)
- **Format**: PNG
- **Background**: Royal Blue (#0047AB)
- **Content**: StatLocker logo and tagline centered
- **Usage**: App launch screen

### Favicon (`favicon.png`)
- **Size**: 32x32px or 16x16px
- **Format**: PNG
- **Design**: Simplified StatLocker logo
- **Usage**: Web version favicon

### Notification Icon (`notification-icon.png`)
- **Size**: 96x96px
- **Format**: PNG with transparency
- **Design**: Monochrome StatLocker logo
- **Usage**: Push notifications

## Design Guidelines

### Brand Colors
- **Primary**: Royal Blue (#0047AB)
- **Secondary**: White (#FFFFFF)
- **Accent**: Aqua Glow (#00D4FF)

### Logo Usage
- Use the full StatLocker wordmark for larger assets
- Use the simplified "S" icon for smaller assets
- Maintain proper contrast and readability
- Follow brand guidelines for spacing and proportions

### Platform Considerations

#### iOS
- Use rounded corners for app icons (system applies automatically)
- Ensure icons work well on various backgrounds
- Test on different iOS versions and devices

#### Android
- Provide adaptive icon foreground
- Test with different launcher themes
- Ensure compatibility with Material Design guidelines

#### Web
- Provide multiple favicon sizes if needed
- Ensure favicon is visible on browser tabs
- Test on different browsers

## Asset Creation Tools

### Recommended Tools
- **Figma**: For vector-based designs
- **Adobe Illustrator**: For professional vector graphics
- **Sketch**: For UI/UX design (macOS only)
- **Canva**: For quick mockups and variations

### Export Settings
- Use PNG format for all assets
- Maintain transparency where needed
- Export at exact required dimensions
- Optimize file sizes without quality loss

## Asset Optimization

### File Size Optimization
- Use tools like TinyPNG or ImageOptim
- Balance quality and file size
- Consider app bundle size impact

### Performance Considerations
- Optimize splash screen for fast loading
- Use appropriate compression for different asset types
- Test loading times on various devices

## Placeholder Assets

Currently, this directory contains placeholder assets. Replace with actual StatLocker branded assets before production deployment.

### Creating Placeholder Assets

For development purposes, you can create simple placeholder assets:

```bash
# Create a simple colored square for icon.png
# Use any image editor or online tool to create:
# - 1024x1024px PNG
# - Royal Blue (#0047AB) background
# - White "SL" text in center

# Create splash.png
# - 1284x2778px PNG
# - Royal Blue (#0047AB) background
# - Centered StatLocker logo and tagline

# Create other assets following the specifications above
```

## Asset Validation

Before production deployment, ensure:

- [ ] All required assets are present
- [ ] Assets meet size and format requirements
- [ ] Icons display correctly on all target platforms
- [ ] Splash screen loads quickly and looks good
- [ ] Brand guidelines are followed consistently
- [ ] Assets are optimized for performance

## Future Considerations

### Additional Assets (Future)
- App Store screenshots
- Google Play Store feature graphics
- Marketing materials
- Social media assets
- Website assets

### Localization
- Consider text-free icons for international markets
- Plan for RTL language support if needed
- Prepare localized screenshots for different markets

## Asset Updates

When updating assets:

1. Update source files first
2. Export new versions following specifications
3. Test on all target platforms
4. Update app version if significant changes
5. Consider backward compatibility

Remember to update this README when adding new assets or changing specifications.