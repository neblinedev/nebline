![image](https://github.com/user-attachments/assets/386350fb-068d-4d24-a2d7-44fc00a96132)


## Nebline

An experimental journaling app with AI-assisted psychological insights.

## About Nebline

Nebline is an open-source journaling application that provides AI-assisted psychological insights to users. The application is designed to help you reflect on your thoughts and emotions through journaling, while offering helpful insights that may contribute to your mental well-being.

<img width="1150" alt="image" src="https://github.com/user-attachments/assets/dafca7ab-fecb-468a-b613-a388265bfb58" />

**Important Disclaimer**: Nebline is not a replacement for professional psychological help. While the app strives to provide valuable insights, it should not be used as a substitute for therapy or professional mental health services.

## How Nebline Works

Nebline is designed with privacy in mind as a fully offline-first journaling application:

- **Local-only storage**: All journal entries are saved as markdown files on your local machine. No data is stored on remote servers.
- **Data privacy**: Nebline does not send any of your data to external servers, except when explicitly generating AI insights using your configured AI provider (such as Anthropic or OpenAI).
- **Sync options**: You can optionally commit your journal to a private GitHub repository or store it in cloud storage solutions like OneDrive or Dropbox for backup and synchronization.

### File Structure

When you point Nebline to a local folder, it automatically creates the following structure:

```
your-journal-folder/
├── nebline.json       # Configuration file containing your AI API keys
└── journal/
    └── YYYY/          # Year folders (e.g., 2025)
        └── WW/        # Calendar week folders (e.g., 01, 02, etc.)
            ├── journal.md    # Your journal entries for the week
            └── insights.md   # AI-generated insights (created when you click "Generate insights")
```

Each week's journal is stored in a separate folder, organized by year and calendar week number, making it easy to navigate and maintain your journaling practice over time.

## Features

- Personal journaling workspace
- AI-assisted psychological insights
- Monaco-based text editor for a smooth writing experience
- Cross-platform desktop application (Windows, macOS, Linux)

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or higher)
- npm (included with Node.js)

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/nebline.git
   cd nebline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Development

To run Nebline in development mode:

```bash
npm run dev
```

This will start the application with hot-reload enabled.

## Building

### Build for all platforms:

```bash
npm run build
```

### Platform-specific builds:

**Windows**:

```bash
npm run build:win
```

**macOS**:

```bash
npm run build:mac
```

**Linux**:

```bash
npm run build:linux
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

_Nebline: Journal with insight._
