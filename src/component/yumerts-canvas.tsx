import React, { Component } from "react";
import archerIcon from '../assets/Archer.png';
import infantryIcon from '../assets/Infantry.png';
import cavalryIcon from '../assets/Cavalry.png';
import grassTexture from '../assets/GrassTexture.png'; // Add your grass texture image here

interface YumertsCanvasState {
    exampleState: string;
    troops: any[];
    selectedTroop: any;
}

interface YumertsCanvasProps {
    websocketUrl: string;
}

class YumertsCanvas extends Component<YumertsCanvasProps, YumertsCanvasState> {

    private socket: WebSocket | undefined;
    private canvasRef: React.RefObject<HTMLCanvasElement>;

    constructor(props: YumertsCanvasProps) {
        super(props);
        this.state = {
            exampleState: "Initial State",
            troops: [],
            selectedTroop: null
        };
        this.canvasRef = React.createRef();
    }

    componentDidMount() {
        const { websocketUrl } = this.props;
        this.socket = new WebSocket(websocketUrl);

        this.socket.onopen = () => {
            console.log("WebSocket connection established");
        };

        this.socket.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            const troops = JSON.parse(event.data);
            this.setState({ troops }, this.drawCanvas);
        };

        this.socket.onclose = () => {
            console.log("WebSocket connection closed");
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.drawCanvas();
    }

    componentWillUnmount() {
        if (this.socket) {
            this.socket.close();
        }
    }

    drawCanvas = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gridSize = 20;
        const cellSize = canvas.width / gridSize;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grass texture background
        const grassImg = new Image();
        grassImg.src = grassTexture;
        grassImg.onload = () => {
            const pattern = ctx.createPattern(grassImg, 'repeat');
            if (pattern) {
                ctx.fillStyle = pattern;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            // Redraw grid with less obvious lines
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Light gray with transparency
            ctx.lineWidth = 0.5;

            for (let x = 0; x <= canvas.width; x += cellSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }

            for (let y = 0; y <= canvas.height; y += cellSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }

            ctx.stroke();

            // Draw troops
            this.state.troops.forEach(troop => {
                const { x, y } = troop.currentCoordinate;
                ctx.fillStyle = troop.faction === "0" ? 'blue' : 'red';
                ctx.fillRect((x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize);

                let troopImage;
                switch (troop.troopType) {
                    case "0":
                        troopImage = infantryIcon;
                        break;
                    case "1":
                        troopImage = archerIcon;
                        break;
                    case "2":
                        troopImage = cavalryIcon;
                        break;
                }
                if (troopImage) {
                    const img = new Image();
                    img.src = troopImage;
                    img.onload = () => {
                        ctx.drawImage(img, (x - 1) * cellSize, (y - 1) * cellSize, cellSize, cellSize);
                    };
                }
            });

            // Draw arrows for troops with target coordinates
            this.state.troops.forEach(troop => {
                const { x: startX, y: startY } = troop.currentCoordinate;
                const { x: endX, y: endY } = troop.targetCoordinate || {};

                if (endX !== undefined && endY !== undefined && (startX !== endX || startY !== endY)) {
                    ctx.beginPath();
                    ctx.moveTo((startX - 1) * cellSize + cellSize / 2, (startY - 1) * cellSize + cellSize / 2);
                    ctx.lineTo((endX - 1) * cellSize + cellSize / 2, (endY - 1) * cellSize + cellSize / 2);
                    ctx.strokeStyle = 'green';
                    ctx.stroke();

                    // Draw arrowhead
                    const headlen = 10; // length of head in pixels
                    const angle = Math.atan2(endY - startY, endX - startX);
                    ctx.beginPath();
                    ctx.moveTo((endX - 1) * cellSize + cellSize / 2, (endY - 1) * cellSize + cellSize / 2);
                    ctx.lineTo((endX - 1) * cellSize + cellSize / 2 - headlen * Math.cos(angle - Math.PI / 6), (endY - 1) * cellSize + cellSize / 2 - headlen * Math.sin(angle - Math.PI / 6));
                    ctx.moveTo((endX - 1) * cellSize + cellSize / 2, (endY - 1) * cellSize + cellSize / 2);
                    ctx.lineTo((endX - 1) * cellSize + cellSize / 2 - headlen * Math.cos(angle + Math.PI / 6), (endY - 1) * cellSize + cellSize / 2 - headlen * Math.sin(angle + Math.PI / 6));
                    ctx.stroke();
                }
            });

            canvas.addEventListener('click', this.handleCanvasClick);
        };
    }

    handleCanvasClick = (event: MouseEvent) => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const cellSize = canvas.width / 20;
        const x = Math.floor((event.clientX - rect.left) / cellSize) + 1;
        const y = Math.floor((event.clientY - rect.top) / cellSize) + 1;

        const clickedTroop = this.state.troops.find(troop => troop.currentCoordinate.x === x && troop.currentCoordinate.y === y);
        if (clickedTroop) {
            this.setState({ selectedTroop: clickedTroop });
            console.log('Troop clicked:', clickedTroop);
        } else {
            console.log('No troop on this cell.');
            if (this.state.selectedTroop) {
                const message = {
                    troopId: this.state.selectedTroop.troopId,
                    targetCoordinate: { x, y }
                };
                this.socket?.send(JSON.stringify(message));
                console.log('Move command sent:', message);
            }
        }
    }

    render() {
        return (
            <div>
                <h1>Yumerts Canvas</h1>
                <p>{this.state.exampleState}</p>
                <canvas ref={this.canvasRef} width="400" height="400"></canvas>
            </div>
        );
    }
}

export default YumertsCanvas;