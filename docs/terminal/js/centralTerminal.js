
// ==========================
// centralTerminal.js
// v3.1 - A Modular, BASH-style Terminal Emulator Library for the Web.
// FINAL - Corrects file system initialization.
// ==========================

// --- VFile and VDirectory Classes (Modern File System) ---
export class VFile {
    constructor(name, content = '', type = 'text') {
        this.name = name;
        this.content = content;
        this.type = type;
    }
}

export class VDirectory {
    constructor(name) {
        this.name = name;
        this.children = {};
    }
    getChild(name) { return this.children[name]; }
}

// --- Terminal Class (UI Handler) ---
export class Terminal {
    constructor(name, containerDiv) {
        this.name = name;
        this.containerDiv = containerDiv;
        this.history = [];
        this.uiComponents = {};
        this._registerDefaultUI();
    }
    _registerDefaultUI() { this.registerComponent('gameArea', 'game-area-container'); }
    registerComponent(name, elementId) { const e = document.getElementById(elementId); if (e) this.uiComponents[name] = e; }
    showComponent(name) { if (this.uiComponents[name]) this.uiComponents[name].style.display = 'block'; }
    hideComponent(name) { if (this.uiComponents[name]) this.uiComponents[name].style.display = 'none'; }
    print(text) { const p = document.createElement("p"); p.textContent = text; this.containerDiv.appendChild(p); this.containerDiv.scrollTop = this.containerDiv.scrollHeight; this.history.push(text); }
    printHtml(html) { const div = document.createElement("div"); div.innerHTML = html; this.containerDiv.appendChild(div); this.containerDiv.scrollTop = this.containerDiv.scrollHeight; this.history.push(html); }
    clear() { this.containerDiv.innerHTML = ""; this.history = []; }
}

// --- Command Class ---
export class Command {
    constructor(name, description, execute, aliases = []) {
        this.name = name;
        this.description = description;
        this.execute = execute;
        this.aliases = aliases;
    }
}

// --- Main Terminal Library ---
export class TerminalLib {
    constructor(terminalInstance, vOS, addonExecutor) {
        this.term = terminalInstance;
        this.vOS = vOS;
        this.addonExecutor = addonExecutor;
        this.commands = {};
        this.commandHistory = [];
        this._registerDefaultCommands();
    }

    addCommand(command) {
        this.commands[command.name] = command;
        command.aliases.forEach(alias => this.commands[alias] = command);
    }

    _registerDefaultCommands() {
        this.addCommand(new Command("pwd", "Print current working directory", () => this.term.print(this.vOS._getFullPath(this.vOS.cwd))));
        this.addCommand(new Command("ls", "List files in current directory", (args) => {
            const path = args[0] || '.';
            const files = this.vOS.listFiles(path);
            this.term.print(files.length > 0 ? files.join('\n') : "Empty directory.");
        }));
        this.addCommand(new Command("cd", "Change directory", (args) => {
            if (!args[0] || !this.vOS.changeDir(args[0])) this.term.print(`cd: no such file or directory: ${args[0] || ''}`);
        }));
        this.addCommand(new Command("cat", "Display file contents", (args) => {
            const file = this.vOS._resolvePath(args[0] || '');
            if (!file || !(file instanceof VFile)) { this.term.print(`cat: No such file: ${args[0]}`); return; }
            switch (file.type) {
                case 'text': file.content.split('\n').forEach(line => this.term.print(line)); break;
                case 'image': this.term.printHtml(`<img src="${file.content}" alt="${file.name}" style="max-width: 100%; height: auto;">`); break;
                case 'audio': this.term.printHtml(`<audio controls src="${file.content}">Your browser does not support audio playback.</audio>`); break;
                case 'exe': this.term.print(`[Executable] To run this, type: run ${file.content}`); break;
                default: this.term.print(`Unsupported file type: ${file.type}`);
            }
        }));
        this.addCommand(new Command("mkdir", "Create a directory", (args) => {
            if (!args[0] || !this.vOS.createDirectory(args[0])) this.term.print(`mkdir: cannot create directory: ${args[0] || ''}`);
        }));
        this.addCommand(new Command("touch", "Create an empty file", (args) => {
             if (!args[0]) { this.term.print("Usage: touch <filename>"); return; }
             if (!this.vOS.createFile(args[0])) this.term.print(`touch: cannot create file: ${args[0]}`);
        }));
        this.addCommand(new Command("rm", "Delete a file", (args) => {
            if (!args[0]) { this.term.print("Usage: rm <filename>"); return; }
            if (!this.vOS.deleteFile(args[0])) this.term.print(`rm: cannot remove '${args[0]}': No such file or directory`);
        }));
        this.addCommand(new Command("echo", "Print text", (args) => this.term.print(args.join(" "))));
        this.addCommand(new Command("history", "Show command history. Use !<number> to rerun.", () => {
            this.commandHistory.forEach((cmd, index) => this.term.print(`${index + 1}: ${cmd}`));
        }));
        this.addCommand(new Command("date", "Displays the current date and time.", () => this.term.print(new Date().toLocaleString()), ["time"]));
        this.addCommand(new Command("tree", "Display the directory structure as a tree.", (args) => {
            const path = args[0] || '.';
            const startNode = this.vOS._resolvePath(path);
            if (startNode instanceof VDirectory) {
                this.term.print(this.vOS._getFullPath(startNode));
                this._printTreeRecursive(startNode);
            } else {
                this.term.print(`tree: '${path}' is not a directory.`);
            }
        }));
        this.addCommand(new Command("clear", "Clear terminal output", () => this.term.clear()));
        this.addCommand(new Command("help", "List available commands", () => {
            const helpText = [...new Set(Object.values(this.commands))].sort((a,b)=>a.name.localeCompare(b.name)).map(c=>`${c.name.padEnd(15)}- ${c.description}`).join('\n');
            this.term.print(helpText);
        }));
        this.addCommand(new Command("run", "Run a registered addon", (args) => {
            if (!args[0]) { this.term.print("Usage: run <addon-name>"); return; }
            this.addonExecutor.startAddon(args[0], this.term, this.vOS);
        }));
        this.addCommand(new Command("exit", "Exits the current addon.", () => {
            if (!this.addonExecutor.activeAddon) { this.term.print("No active addon to exit."); return; }
            this.addonExecutor.stopAddon();
        }));
    }

    runCommand(input) {
        input = input.trim();
        if (!input) return;
        if (input.startsWith('!')) {
            const idx = parseInt(input.substring(1), 10) - 1;
            const cmd = this.commandHistory[idx];
            if (cmd) { this.term.print(`> ${cmd}`); this.runCommand(cmd); } 
            else { this.term.print("Invalid history index."); }
            return;
        }
        if (this.commandHistory[this.commandHistory.length - 1] !== input) this.commandHistory.push(input);
        if (this.addonExecutor.activeAddon) {
            if (input.toLowerCase() === 'exit') this.addonExecutor.stopAddon();
            else this.addonExecutor.handleCommand(input);
            return;
        }
        const parts = input.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const cmdName = parts.shift()?.replace(/"/g, '').toLowerCase();
        if (!cmdName) return;
        const args = parts.map(arg => arg.replace(/"/g, ''));
        const command = this.commands[cmdName];
        if (command) command.execute(args);
        else this.term.print(`Command not recognized: ${cmdName}.`);
    }

    _printTreeRecursive(directory, prefix = '') {
        const children = Object.values(directory.children);
        children.forEach((child, index) => {
            const isLast = index === children.length - 1;
            const decorator = isLast ? '└── ' : '├── ';
            const newPrefix = prefix + (isLast ? '    ' : '│   ');
            if (child instanceof VDirectory) {
                this.term.print(`${prefix}${decorator}${child.name}/`);
                this._printTreeRecursive(child, newPrefix);
            } else {
                this.term.print(`${prefix}${decorator}${child.name}`);
            }
        });
    }
}

// --- VirtualOS Class (Modern File System) ---
export class VirtualOS {
    constructor() {
        this.root = new VDirectory('/');
        this.cwd = this.root;
        this._initializeFileSystem();
    }

    _initializeFileSystem() {
        // Common directories shared across all VMs
        this.createDirectory('/C');
        this.createDirectory('/C/Users');
        this.createDirectory('/C/Program Files');
        this.createDirectory('/D');
        this.createFile('/readme.txt', 'Welcome to the terminal!');
    }

    _resolvePath(path) {
        if (path === '/') return this.root;
        let parts = path.split('/').filter(p => p.length > 0);
        let current = path.startsWith('/') ? this.root : this.cwd;
        for (let part of parts) {
            if (part === '..') current = this._getParent(current) || current;
            else if (part !== '.') {
                if (current instanceof VDirectory && current.getChild(part)) current = current.getChild(part);
                else return null;
            }
        }
        return current;
    }

    _getParent(node) {
        if (node === this.root) return null;
        const findParent = (dir, target) => {
            for (const child of Object.values(dir.children)) {
                if (child === target) return dir;
                if (child instanceof VDirectory) {
                    const found = findParent(child, target);
                    if (found) return found;
                }
            }
            return null;
        }
        return findParent(this.root, node);
    }

    _getFullPath(directory) {
        if (directory === this.root) return '/';
        let path = '';
        let current = directory;
        while (current && current !== this.root) {
            path = '/' + current.name + path;
            current = this._getParent(current);
        }
        return path || '/';
    }

    createFile(path, content = '', type = 'text') {
        const parts = path.split('/');
        const filename = parts.pop();
        const dirPath = parts.join('/') || '/';
        const directory = this._resolvePath(dirPath);
        if (directory instanceof VDirectory && !directory.children[filename]) {
            directory.children[filename] = new VFile(filename, content, type);
            return true;
        }
        return false;
    }

    deleteFile(path) {
        const parts = path.split('/');
        const filename = parts.pop();
        const dirPath = parts.join('/') || '/';
        const directory = this._resolvePath(dirPath);
        if (directory instanceof VDirectory && directory.getChild(filename) instanceof VFile) {
            delete directory.children[filename];
            return true;
        }
        return false;
    }

    createDirectory(path) {
        const parts = path.split('/');
        const dirname = parts.pop() || path; // Handle cases like '/C'
        const parentPath = parts.join('/') || '/';
        const parentDir = this._resolvePath(parentPath);
        if (parentDir instanceof VDirectory && !parentDir.children[dirname]) {
            parentDir.children[dirname] = new VDirectory(dirname);
            return true;
        }
        return false;
    }

    listFiles(path = '.') {
        const directory = this._resolvePath(path);
        if (directory instanceof VDirectory) {
            return Object.keys(directory.children).map(key => directory.children[key] instanceof VDirectory ? `${key}/` : key);
        }
        return [];
    }

    changeDir(path) {
        const newDir = this._resolvePath(path);
        if (newDir instanceof VDirectory) {
            this.cwd = newDir;
            return true;
        }
        return false;
    }
}

// --- Addon Handling ---
export class Addon {
    constructor(name) { this.name=name; this.term=null; this.vOS=null; }
    onStart(term, vOS) { this.term=term; this.vOS=vOS; }
    onCommand(input) { this.term.print(`[${this.name}]> ${input}`); }
    onStop() { }
}

export class AddonExecutor {
    constructor() { this.addons={}; this.activeAddon=null; }
    registerAddon(addon) { this.addons[addon.name.toLowerCase()] = addon; }
    startAddon(name, term, vOS) {
        if (this.activeAddon) { term.print("An addon is already running. Please 'exit' first."); return; }
        const addon = this.addons[name.toLowerCase()];
        if (addon) {
            this.activeAddon = addon;
            addon.onStart(term, vOS);
        } else {
            term.print(`Addon not found: ${name}`);
        }
    }
    stopAddon() {
        if (this.activeAddon) {
            this.activeAddon.onStop();
            this.activeAddon = null;
            this.term.print("Returned to main terminal.");
        }
    }
    handleCommand(input) { if (this.activeAddon) this.activeAddon.onCommand(input); }
}
