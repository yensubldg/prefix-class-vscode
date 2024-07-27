// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function convertToClassName(classes: string, prefix: string) {
  let count: number = 0;
  const classList: string[] = classes.split(" ");

  const convertedText = classList
    .map((c: string) => {
      if (c.startsWith(prefix)) {
        return c;
      }

      if (c.includes(":")) {
        // get last part of class name
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

function changePrefix({
  prefix = "tw-",
  type = 0,
}: {
  prefix?: string;
  type?: number;
}) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let document = editor.document;
  let selection = editor.selection;
  let text = document.getText(selection);

  let className = text.match(/(?<=class(?:Name)?=")(.*?)(?=")/g);
  let newText = "";
  let count = 0;
  switch (type) {
    case 0: // from string
      newText = convertToClassName(text, prefix).convertedText;
      count = convertToClassName(text, prefix).count;
      break;
    case 1: // from html
      if (!className) {
        return;
      }
      className.forEach((s: string) => {
        let newClass = convertToClassName(s, prefix).convertedText;
        count += convertToClassName(s, prefix).count;
        text = text.replace(s, newClass);
      });
      newText = text;
      break;
    default:
      newText = text;
  }

  editor.edit((builder: vscode.TextEditorEdit) => {
    builder.replace(selection, newText);

    vscode.window.showInformationMessage(
      `Prefix ${prefix} added to ${count} class names`
    );
  });
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
      vscode.window
        .showInputBox({ prompt: `Enter new prefix for:` })
        .then((prefix: string | undefined) => {
          changePrefix({ prefix, type: 0 });
        });
    }
  );

  let fromHtml = vscode.commands.registerCommand(
    "prefixclass.changePrefixFromHtml",
    () => {
      vscode.window
        .showInputBox({ prompt: `Enter new prefix for:` })
        .then((prefix: string | undefined) => {
          changePrefix({ prefix, type: 1 });
        });
    }
  );

  const subscriptions = [fromString, fromHtml];

  context.subscriptions.push(...subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
