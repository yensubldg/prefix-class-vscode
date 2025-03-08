// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

/**
 * Converts class names by adding prefixes to them
 */
function convertToClassName(classes: string, prefix: string) {
  let count: number = 0;
  const classList: string[] = classes.split(" ").filter(c => c.trim() !== "");

  const convertedText = classList
    .map((c: string) => {
      if (c.startsWith(prefix)) {
        return c;
      }

      if (c.includes(":")) {
        // handle pseudo-classes like hover:bg-blue-500
        let lastPart = c.split(":").pop();

        if (lastPart) {
          if (!lastPart.startsWith(prefix)) {
            count++;
            return c.replace(lastPart, prefix + lastPart);
          }
          return c;
        }
      } else {
        count++;
        return prefix + c;
      }
    })
    .join(" ");

  return {
    count,
    convertedText,
  };
}

/**
 * Removes a prefix from class names
 */
function removePrefix(classes: string, prefix: string) {
  let count: number = 0;
  const classList: string[] = classes.split(" ").filter(c => c.trim() !== "");

  const convertedText = classList
    .map((c: string) => {
      if (c.startsWith(prefix)) {
        count++;
        return c.slice(prefix.length);
      }

      if (c.includes(":")) {
        // handle pseudo-classes
        let parts = c.split(":");
        let lastPart = parts.pop();

        if (lastPart && lastPart.startsWith(prefix)) {
          count++;
          return [...parts, lastPart.slice(prefix.length)].join(":");
        }
      }
      
      return c;
    })
    .join(" ");

  return {
    count,
    convertedText,
  };
}

function getConfiguration() {
  const config = vscode.workspace.getConfiguration("prefixclass");
  return {
    defaultPrefix: config.get<string>("defaultPrefix") || "tw-",
    enableStatusBarInfo: config.get<boolean>("enableStatusBarInfo") || true,
    fileExtensions: config.get<string[]>("fileExtensions") || [".html", ".jsx", ".tsx"]
  };
}

function changePrefix({
  prefix,
  type = 0,
  operation = "add"
}: {
  prefix?: string;
  type?: number;
  operation?: "add" | "remove";
}) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }

  const document = editor.document;
  const selection = editor.selection;
  
  // Check if the current file extension is supported
  const config = getConfiguration();
  const fileExtension = document.fileName.substring(document.fileName.lastIndexOf('.'));
  if (!config.fileExtensions.includes(fileExtension)) {
    vscode.window.showWarningMessage(`Current file extension (${fileExtension}) is not in the supported list. You can change this in settings.`);
  }
  
  let text = document.getText(selection);
  if (!text && selection.isEmpty) {
    // If no selection, process the entire document
    text = document.getText();
  }

  // If no text is found or selected
  if (!text.trim()) {
    vscode.window.showWarningMessage("No text selected or empty document");
    return;
  }

  let className = text.match(/(?<=class(?:Name)?=["'])(.*?)(?=["'])/g);
  let newText = "";
  let count = 0;

  // Ensure prefix is not undefined
  const actualPrefix = prefix || config.defaultPrefix;

  // Create a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  if (config.enableStatusBarInfo) {
    statusBarItem.text = `$(loading~spin) Processing class names...`;
    statusBarItem.show();
  }

  try {
    switch (type) {
      case 0: // from string
        if (operation === "add") {
          const result = convertToClassName(text, actualPrefix);
          newText = result.convertedText;
          count = result.count;
        } else {
          const result = removePrefix(text, actualPrefix);
          newText = result.convertedText;
          count = result.count;
        }
        break;
      case 1: // from html
        if (!className) {
          vscode.window.showWarningMessage("No class or className attributes found in the selected text");
          return;
        }
        
        className.forEach((s: string) => {
          if (operation === "add") {
            let result = convertToClassName(s, actualPrefix);
            count += result.count;
            text = text.replace(s, result.convertedText);
          } else {
            let result = removePrefix(s, actualPrefix);
            count += result.count;
            text = text.replace(s, result.convertedText);
          }
        });
        newText = text;
        break;
      default:
        newText = text;
    }

    // Apply the changes
    editor.edit((builder: vscode.TextEditorEdit) => {
      if (selection.isEmpty && type === 1) {
        // If no selection but processing HTML, replace entire document
        const fullRange = new vscode.Range(
          document.lineAt(0).range.start,
          document.lineAt(document.lineCount - 1).range.end
        );
        builder.replace(fullRange, newText);
      } else {
        builder.replace(selection, newText);
      }
    }).then(success => {
      if (success) {
        const action = operation === "add" ? "added to" : "removed from";
        const message = `${actualPrefix} ${action} ${count} class names`;
        
        if (config.enableStatusBarInfo) {
          statusBarItem.text = `$(check) ${message}`;
          setTimeout(() => statusBarItem.dispose(), 3000);
        }
        
        vscode.window.showInformationMessage(message);
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Error processing class names: ${error}`);
    statusBarItem.dispose();
  }
}

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "prefixclass" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let fromString = vscode.commands.registerCommand(
    "prefixclass.changePrefixFromString",
    () => {
      const config = getConfiguration();
      vscode.window
        .showInputBox({ 
          prompt: `Enter prefix to add to class names:`, 
          value: config.defaultPrefix
        })
        .then((prefix: string | undefined) => {
          if (prefix !== undefined) {
            changePrefix({ prefix, type: 0, operation: "add" });
          }
        });
    }
  );

  let fromHtml = vscode.commands.registerCommand(
    "prefixclass.changePrefixFromHtml",
    () => {
      const config = getConfiguration();
      vscode.window
        .showInputBox({ 
          prompt: `Enter prefix to add to class names:`, 
          value: config.defaultPrefix
        })
        .then((prefix: string | undefined) => {
          if (prefix !== undefined) {
            changePrefix({ prefix, type: 1, operation: "add" });
          }
        });
    }
  );
  
  // Register "Remove Prefix" commands
  let removeFromString = vscode.commands.registerCommand(
    "prefixclass.removePrefixFromString",
    () => {
      const config = getConfiguration();
      vscode.window
        .showInputBox({ 
          prompt: `Enter prefix to remove from class names:`, 
          value: config.defaultPrefix
        })
        .then((prefix: string | undefined) => {
          if (prefix !== undefined) {
            changePrefix({ prefix, type: 0, operation: "remove" });
          }
        });
    }
  );

  let removeFromHtml = vscode.commands.registerCommand(
    "prefixclass.removePrefixFromHtml",
    () => {
      const config = getConfiguration();
      vscode.window
        .showInputBox({ 
          prompt: `Enter prefix to remove from class names:`, 
          value: config.defaultPrefix
        })
        .then((prefix: string | undefined) => {
          if (prefix !== undefined) {
            changePrefix({ prefix, type: 1, operation: "remove" });
          }
        });
    }
  );

  const subscriptions = [
    fromString, 
    fromHtml, 
    removeFromString, 
    removeFromHtml
  ];

  context.subscriptions.push(...subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
