class DrawingApp {
    constructor() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // State variables
        this.isDrawing = false;
        this.currentTool = 'pencil';
        this.color = '#000000';
        this.lineWidth = 5;
        this.startPoint = null;
        
        // History for undo/redo
        this.history = [];
        this.redoStack = [];

        // Initialize canvas
        this.initCanvas();
        this.bindEvents();
    }

    // Initialize canvas with white background
    initCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveCanvasState();
    }

    // Save current canvas state
    saveCanvasState() {
        const currentState = this.canvas.toDataURL();
        this.history.push(currentState);
        this.redoStack = [];
    }

    // Restore last canvas state
    restoreLastState() {
        if (this.history.length > 0) {
            const lastState = this.history[this.history.length - 1];
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = lastState;
        }
    }

    // Bind events to tools and canvas
    bindEvents() {
        // Tool Selection
        document.getElementById('pencilTool').addEventListener('click', () => this.setTool('pencil'));
        document.getElementById('eraserTool').addEventListener('click', () => this.setTool('eraser'));
        document.getElementById('rectangleTool').addEventListener('click', () => this.setTool('rectangle'));
        document.getElementById('squareTool').addEventListener('click', () => this.setTool('square'));
        document.getElementById('circleTool').addEventListener('click', () => this.setTool('circle'));

        // Color and Width
        document.getElementById('colorPicker').addEventListener('change', (e) => {
            this.color = e.target.value;
        });
        document.getElementById('lineWidth').addEventListener('change', (e) => {
            this.lineWidth = parseInt(e.target.value, 10);
        });

        // Action Buttons
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearCanvas());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadCanvas());

        // Drawing Events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));
    }

    // Set current drawing tool
    setTool(tool) {
        this.currentTool = tool;
        // Reset active states on buttons
        ['pencil', 'eraser', 'rectangle', 'square', 'circle'].forEach(t => {
            const btn = document.getElementById(`${t}Tool`);
            btn.classList.remove('active');
        });
        document.getElementById(`${tool}Tool`).classList.add('active');
    }

    // Start drawing
    startDrawing(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.startPoint = { x, y };

        if (this.currentTool === 'pencil' || this.currentTool === 'eraser') {
            this.ctx.beginPath();
            this.ctx.moveTo(x, y);
        }
    }

    // Drawing method
    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.strokeStyle = this.currentTool === 'eraser' ? 'white' : this.color;
        this.ctx.lineWidth = this.lineWidth;
        this.ctx.lineCap = 'round';

        switch(this.currentTool) {
            case 'pencil':
            case 'eraser':
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
                break;
            case 'rectangle':
                this.drawRectangle(x, y, false);
                break;
            case 'square':
                this.drawRectangle(x, y, true);
                break;
            case 'circle':
                this.drawCircle(x, y);
                break;
        }
    }

    // Draw rectangle or square
    drawRectangle(x, y, isSquare) {
        this.restoreLastState();
        this.ctx.beginPath();
        
        if (isSquare) {
            // Ensure equal width and height
            const size = Math.min(
                Math.abs(x - this.startPoint.x), 
                Math.abs(y - this.startPoint.y)
            );
            
            // Determine direction
            const dirX = x > this.startPoint.x ? 1 : -1;
            const dirY = y > this.startPoint.y ? 1 : -1;
            
            this.ctx.strokeRect(
                this.startPoint.x, 
                this.startPoint.y, 
                size * dirX, 
                size * dirY
            );
        } else {
            // Regular rectangle
            this.ctx.strokeRect(
                this.startPoint.x, 
                this.startPoint.y, 
                x - this.startPoint.x, 
                y - this.startPoint.y
            );
        }
    }

    // Draw circle
    drawCircle(x, y) {
        this.restoreLastState();
        const radius = Math.sqrt(
            Math.pow(x - this.startPoint.x, 2) + 
            Math.pow(y - this.startPoint.y, 2)
        );
        
        this.ctx.beginPath();
        this.ctx.arc(this.startPoint.x, this.startPoint.y, radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    // Stop drawing
    stopDrawing() {
        if (this.isDrawing) {
            this.ctx.closePath();
            this.isDrawing = false;
            
            if (['pencil', 'eraser', 'rectangle', 'square', 'circle'].includes(this.currentTool)) {
                this.saveCanvasState();
            }
            
            this.startPoint = null;
        }
    }

    // Undo last action
    undo() {
        if (this.history.length > 1) {
            const currentState = this.history.pop();
            this.redoStack.push(currentState);
            
            const prevState = this.history[this.history.length - 1];
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = prevState;
        }
    }

    // Redo last undone action
    redo() {
        if (this.redoStack.length > 0) {
            const nextState = this.redoStack.pop();
            this.history.push(nextState);
            
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0);
            };
            img.src = nextState;
        }
    }

    // Clear entire canvas
    clearCanvas() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.saveCanvasState();
    }

    // Download canvas as image
    downloadCanvas() {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DrawingApp();
});