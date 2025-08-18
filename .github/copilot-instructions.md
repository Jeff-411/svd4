This codebase is being developed to meet the needs of a single specific client using the latest version of the Vivaldi browser in a Windows 10/11 OS.

Ignore all folders and files in the `__dev` directory and its subdirectories, unless specifically instructed otherwise.

Ignore all `*.text` files unless specifically instructed otherwise.

Review all folders and files in the `src/scripts/utils/debug_enable-zoom.js/` directory and its subdirectories.

When suggesting changes that involve copying existing values:

- Explicitly verify that values match exactly
- Use checksum/diff tools when appropriate
- Note if you're suggesting any modifications to existing values

Before providing a response:

- Double-check all file paths are correct
- Verify all code snippets compile/parse
- Confirm any quoted values match source exactly
- Highlight any assumptions being made

When showing code changes:

- Mark critical values that must not be altered
- Highlight security-sensitive sections
- Include validation steps for the user

When code changes are located inside a single function:

- Provide a complete copy/paste-ready version of the updated function

When code changes are not located inside a single function:

- Provide a complete copy/paste-ready version of the updated file
- Always include the first commented line in the original file
- If the first commented line in a file includes a version number (e.g.: v1, Version: 1, V2, etc.), ALWAYS increment the version number when making changes of any sort whatsoever to the file.
