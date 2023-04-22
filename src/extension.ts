// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";

function changePrefixFromString({ prefix = "tw-" }: { prefix?: string }) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let document = editor.document;
  let selection = editor.selection;
  let text = document.getText(selection);
  let newText = text
    .split(" ")
    .map((c: string) => (c.startsWith(prefix) ? c : prefix + c))
    .join(" ");

  editor.edit((builder: vscode.TextEditorEdit) => {
    builder.replace(selection, newText);
  });
}

function changePrefixFromHtml({ prefix = "tw-" }: { prefix?: string }) {
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let document = editor.document;
  let selection = editor.selection;
  let text = document.getText(selection);
  let className = text.match(/(?<=class(?:Name)?=")(.*?)(?=")/g);
  if (!className) {
    return;
  }
  className.forEach((s: string) => {
    let newClass = s
      .split(" ")
      .map((c: string) => (c.startsWith(prefix) ? c : prefix + c))
      .join(" ");
    // replace old class name with new class name
    text = text.replace(s, newClass);
  });

  editor.edit((builder: vscode.TextEditorEdit) => {
    builder.replace(selection, text);
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
          changePrefixFromString({ prefix });
        });
    }
  );

  let fromHtml = vscode.commands.registerCommand(
    "prefixclass.changePrefixFromHtml",
    () => {
      vscode.window
        .showInputBox({ prompt: `Enter new prefix for:` })
        .then((prefix: string | undefined) => {
          changePrefixFromHtml({ prefix });
        });
    }
  );

  const subscriptions = [fromString, fromHtml];

  context.subscriptions.push(...subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
