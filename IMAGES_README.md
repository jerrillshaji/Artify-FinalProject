# Images Setup Guide for Artify Project Report

This guide explains what images you need to add and where to place them for the LaTeX project report to compile successfully.

## Required Images

### 1. College Logo (Required for Title Page)
- **Filename:** `saintgits_logo.jpg`
- **Location:** Project root folder (`Artify-FinalProject/`)
- **Description:** Saintgits College of Engineering logo (white background preferred)
- **Where to get:** Download from college website or use existing logo file

### 2. Bonafide Certificate (Required)
- **Filename:** `certificate.pdf`
- **Location:** Project root folder (`Artify-FinalProject/`)
- **Description:** Signed bonafide certificate document (scanned)
- **How to create:** Get the signed certificate from your guide, scan as PDF

### 3. Plagiarism Report (Required)
- **Filename:** `plagiarism_report.pdf`
- **Location:** Project root folder (`Artify-FinalProject/`)
- **Description:** Turnitin or similar plagiarism check report
- **How to create:** Generate from plagiarism checking service

### 4. Diagrams (Create or Use Placeholders)

#### Entity Relationship Diagram (ERD)
- **Filename:** `erd_diagram.png`
- **Location:** Project root folder
- **Description:** Shows database table relationships
- **How to create:** 
  - Use draw.io, Lucidchart, or similar tool
  - Show relationships: Users → Profiles → Artists/Managers → Events → Bookings → Messages
  - Export as PNG (width: ~1200px)

#### Data Flow Diagram (DFD)
- **Filename:** `dfd_artify.png`
- **Location:** Project root folder
- **Description:** Shows how data flows through the system
- **How to create:**
  - Show: User Registration → Profile Creation → Event Publishing → Booking → Messaging
  - Export as PNG (width: ~1200px)

#### System Architecture Diagram
- **Filename:** `architecture_artify.png`
- **Location:** Project root folder
- **Description:** Shows system architecture components
- **How to create:**
  - Show: React Frontend → Supabase Backend (Auth, Database, Storage)
  - Export as PNG (width: ~1200px)

### 5. Screenshots (Create from Your Application)

Create a folder named `screenshots` in the project root:
```
Artify-FinalProject/
├── screenshots/
│   ├── landing_page.png
│   ├── login_page.png
│   ├── register_page.png
│   ├── artist_dashboard.png
│   ├── manager_dashboard.png
│   ├── event_listing.png
│   ├── booking_calendar.png
│   ├── messaging_interface.png
│   ├── profile_page.png
│   └── mobile_responsive.png
```

**How to capture screenshots:**
1. Run your application: `npm run dev`
2. Open in browser (usually http://localhost:5173)
3. Navigate to each page
4. Use browser DevTools (F12) → Device Toolbar for mobile view
5. Take screenshots using:
   - Windows: `Win + Shift + S` (Snipping Tool)
   - Browser extensions: "Full Page Screen Capture"
   - DevTools: Three dots → "Run command" → "Capture screenshot"

**Screenshot specifications:**
- Format: PNG
- Minimum width: 1200px
- Clear and readable text
- Show relevant content (scroll if needed)

## Quick Setup (If Images Not Available Yet)

The LaTeX file is configured to show placeholder boxes if images are missing. To compile without images:

1. The current `.tex` file uses `\fbox{}` placeholders
2. When you add actual images, uncomment the `\includegraphics` lines and remove the `\fbox` placeholders

## Example: Adding a Screenshot

**Before (placeholder):**
```latex
\begin{figure}[!htbp]
\centering
% \includegraphics[width=0.95\textwidth]{screenshots/landing_page.png}
\fbox{\begin{minipage}[c][4cm]{0.95\textwidth}
    \centering
    \textit{Screenshot: Landing Page}
\end{minipage}}
\caption{Landing Page}
\end{figure}
```

**After (with actual image):**
```latex
\begin{figure}[!htbp]
\centering
\includegraphics[width=0.95\textwidth]{screenshots/landing_page.png}
% Comment out or remove the \fbox placeholder
\caption{Landing Page}
\end{figure}
```

## Checklist

- [ ] `saintgits_logo.jpg` - College logo
- [ ] `certificate.pdf` - Signed bonafide certificate
- [ ] `plagiarism_report.pdf` - Plagiarism check report
- [ ] `erd_diagram.png` - ER diagram
- [ ] `dfd_artify.png` - Data Flow Diagram
- [ ] `architecture_artify.png` - Architecture diagram
- [ ] `screenshots/` folder created
- [ ] All 10 screenshots captured and saved

## Tools for Creating Diagrams

1. **draw.io** (Free, Online): https://draw.io
2. **Lucidchart** (Freemium): https://lucidchart.com
3. **Excalidraw** (Free, Hand-drawn style): https://excalidraw.com
4. **Figma** (Free tier): https://figma.com

## Compiling the Report

After adding images, compile using:
```bash
# Using pdflatex
pdflatex project_report_artify.tex
pdflatex project_report_artify.tex  # Run twice for TOC

# Or use Overleaf (upload all images and .tex file)
```

## Notes

- Keep image file sizes reasonable (< 2MB each)
- Use PNG for diagrams/screenshots (better quality)
- Use JPG for photos (smaller file size)
- Ensure all images are in the same directory level as specified
- If using Overleaf, upload images to the project root
