![image](https://github.com/user-attachments/assets/386350fb-068d-4d24-a2d7-44fc00a96132)

## Nebline

An experimental journaling app with AI-assisted psychological insights.

<img width="1413" alt="image" src="https://github.com/user-attachments/assets/bfc94890-0950-4582-9a1f-516288ceed9c" />

## About Nebline

Nebline is an open-source journaling application that provides AI-assisted psychological insights to users. The application is designed to help you reflect on your thoughts and emotions through journaling, while offering helpful insights that may contribute to your mental well-being.

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
├── overview.md       # Contains long-term information about the user
├── insights.md       # Contains AI analysis on the overview and recent journal entries
└── journal/
    └── YYYY/          # Year folders (e.g., 2025)
        └── WW/        # Calendar week folders (e.g., 01, 02, etc.)
            ├── journal.md    # Your journal entries for the week
            └── insights.md   # AI-generated insights for the specific week
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
   git clone git@github.com:neblinedev/nebline.git
   cd nebline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running Nebline

For now, there are no binaries. You need to build and run it from source.

To run Nebline in development mode:

```bash
npm run dev
```

This will start the application with hot-reload enabled.

## Configuration

Nebline is designed for power users who want full control over their journaling experience and AI model selection. The application uses a configuration file (`nebline.json`) that follows a specific schema to manage AI providers and API keys.

### The `nebline.json` Configuration File

When you first point Nebline to a folder, it creates a `nebline.json` file with the following structure:

```json
{
  "model": "anthropic:claude-3-7-sonnet-20250219",
  "anthropicApiKey": "",
  "openAiApiKey": "",
  "openRouterApiKey": "",
  "googleApiKey": ""
}
```

### Configuration Schema

The configuration follows the schema defined in `src/renderer/src/lib/project/project-schema.ts`:

```typescript
export const projectConfigSchema = z.object({
  model: z.string(),
  anthropicApiKey: z.string(),
  openAiApiKey: z.string(),
  googleApiKey: z.string(),
  openRouterApiKey: z.string()
})
```

### AI Provider Configuration

Nebline uses the AI SDK to interact with different AI providers. The AI registry is populated based on your `ProjectConfig` values:

1. **Model Selection**: The `model` field determines which AI provider will be used for generating insights. The format is `provider:model-name`.

2. **Provider Prefix**: The provider is determined by the prefix of the model string:

   - `anthropic:` - Uses Anthropic's models (requires `anthropicApiKey`)
   - `openai:` - Uses OpenAI's models (requires `openAiApiKey`)
   - `openrouter:` - Uses OpenRouter's models (requires `openRouterApiKey`)

3. **API Keys**: You only need to provide the API key for the provider you're using. Keys for unused providers can be left blank.

### Examples

#### Using Anthropic Claude

```json
{
  "model": "anthropic:claude-3-7-sonnet-20250219",
  "anthropicApiKey": "your-anthropic-api-key",
  "openAiApiKey": "",
  "openRouterApiKey": "",
  "googleApiKey": ""
}
```

#### Using OpenAI GPT-4

```json
{
  "model": "openai:gpt-4-turbo",
  "anthropicApiKey": "",
  "openAiApiKey": "your-openai-api-key",
  "openRouterApiKey": "",
  "googleApiKey": ""
}
```

#### Using OpenRouter

OpenRouter allows access to various models from different providers through a single API. When using OpenRouter, specify the model with the format `openrouter:provider/model-name`:

```json
{
  "model": "openrouter:google/gemini-2.5-pro-preview-03-25",
  "anthropicApiKey": "",
  "openAiApiKey": "",
  "openRouterApiKey": "your-openrouter-api-key",
  "googleApiKey": ""
}
```

You can find a complete list of available models on the [OpenRouter Models page](https://openrouter.ai/models).

### Obtaining API Keys

To use Nebline's AI features, you'll need to obtain API keys from the respective providers:

- **Anthropic**: Sign up at [Anthropic's website](https://www.anthropic.com/)
- **OpenAI**: Sign up at [OpenAI's platform](https://platform.openai.com/)
- **OpenRouter**: Sign up at [OpenRouter](https://openrouter.ai/)

### Technical Note

The AI registry in Nebline is updated when a project is loaded, using the configuration values from `nebline.json`. This approach allows for flexible model selection without hardcoding model names or using environment variables.

## Backing Up Your Journal with GitHub (Optional)

For users who want to back up their journal securely and sync it across devices, using a private GitHub repository is a great free option. This guide assumes you have no prior experience with Git or GitHub.

**What are Git and GitHub?**

- **Git:** A version control system that tracks changes to your files locally on your computer. Think of it like a "save" button with a history, allowing you to revert to previous versions.
- **GitHub:** A website that hosts Git repositories online. It allows you to store your local Git repository remotely, providing a backup and enabling collaboration (though for a private journal, you'll likely be the only user).

**Steps to Set Up:**

1.  **Install Git:**

    - Go to the official [Git website](https://git-scm.com/downloads).
    - Download the installer for your operating system (Windows, macOS, or Linux).
    - Run the installer and follow the on-screen instructions. Accept the default settings unless you have specific preferences.

2.  **Create a GitHub Account:**

    - Go to [GitHub's website](https://github.com/).
    - Sign up for a free account.

3.  **Create a New Private Repository on GitHub:**

    - Once logged into GitHub, click the "+" icon in the top-right corner and select "New repository".
    - Give your repository a name (e.g., `my-private-journal`).
    - **Crucially, select "Private"** to ensure only you can see it.
    - You can leave other options like adding a README, .gitignore, or license unchecked for now, as Nebline manages the folder structure.
    - Click "Create repository".

4.  **Initialize Git in Your Journal Folder:**

    - Open a terminal or command prompt on your computer.
    - Navigate to the folder where you store your Nebline journal (the one containing `nebline.json`, `overview.md`, etc.). Use the `cd` command (e.g., `cd path/to/your/journal/folder`).
    - Run the following command to initialize a Git repository in this folder:
      ```bash
      git init
      ```
    - Configure your Git username and email (only needs to be done once per computer):
      ```bash
      git config --global user.name "Your Name"
      git config --global user.email "your.email@example.com"
      ```
      (Use the email associated with your GitHub account).

5.  **Connect Your Local Folder to the GitHub Repository:**

    - On the GitHub page for your newly created repository, find the section "…or push an existing repository from the command line".
    - Copy the two lines of commands provided there. They will look something like this (replace `<your-username>` and `<your-repo-name>`):
      ```bash
      git remote add origin https://github.com/<your-username>/<your-repo-name>.git
      git branch -M main
      ```
    - Paste and run these commands in your terminal (while still in your journal folder). The first command links your local folder to the remote GitHub repository (named `origin`). The second ensures your main branch is called `main`.

6.  **Add, Commit, and Push Your Journal:**

    - Now, you'll add all your current journal files to Git's tracking system, save a snapshot (commit), and upload it (push) to GitHub.
    - Run these commands one by one in your terminal:

      ```bash
      # Stage all files in the current folder for the commit
      git add .

      # Create a snapshot (commit) with a descriptive message
      git commit -m "Initial journal backup"

      # Upload your commit to the 'main' branch on GitHub ('origin')
      git push -u origin main
      ```

    - You might be prompted to log in to GitHub through your terminal or a pop-up window.

**Ongoing Backups:**

Whenever you make changes to your journal (add new entries, update the overview, etc.) and want to back them up to GitHub, repeat Step 6:

```bash
# Stage any new or modified files
git add .

# Commit the changes with a message
git commit -m "Update journal entries for CW-XX" # (Use a relevant message)

# Push the changes to GitHub
git push origin main
```

That's it! Your journal is now backed up privately on GitHub. You can access it from anywhere by logging into GitHub, and if you set up Git on another computer, you can `git clone` your private repository to sync your journal there.

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
