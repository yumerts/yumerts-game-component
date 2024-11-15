import React, { Component } from "react";
import archerIcon from '../assets/Archer.png';
import infantryIcon from '../assets/Infantry.png';
import cavalryIcon from '../assets/Cavalry.png';
import grassImage from '../assets/GrassTexture.png';

interface YumertsCanvasState {
    exampleState: string;
    troops: any[];
    selectedTroop: any;
}

interface YumertsCanvasProps {
    inputReceived: (input: any) => void;
}

class YumertsCanvas extends Component<YumertsCanvasProps, YumertsCanvasState> {

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
        this.drawCanvas();
    }

    componentWillUnmount() {
        // Cleanup if necessary
    }

    shouldComponentUpdate(nextProps: YumertsCanvasProps, nextState: YumertsCanvasState) {
        // Only update if the exampleState or selectedTroop has changed
        return this.state.exampleState !== nextState.exampleState || this.state.selectedTroop !== nextState.selectedTroop;
    }

    updateState = (newState: string) => {
        const troops = JSON.parse(newState);
        this.setState({ troops }, this.drawCanvas);
    }

    drawCanvas = () => {
        const canvas = this.canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const gridSize = 20;
        const cellSize = canvas.width / gridSize;

        // Draw background
        const background = new Image();
        background.src = grassImage;
        background.onload = () => {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

            // Redraw grid
            ctx.beginPath();
            for (let x = 0; x <= canvas.width; x += cellSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
            }

            for (let y = 0; y <= canvas.height; y += cellSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
            }

            ctx.strokeStyle = '#888'; // Changed stroke color to a less apparent shade
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
            // Draw cracks based on troop health
            this.state.troops.forEach(troop => {
                const { x, y, health } = troop;
                if (health < 100) {
                    const crackCount = Math.floor((100 - health) / 20); // More cracks for lower health
                    for (let i = 0; i < crackCount; i++) {
                        const crackX = (x - 1) * cellSize + Math.random() * cellSize;
                        const crackY = (y - 1) * cellSize + Math.random() * cellSize;
                        ctx.beginPath();
                        ctx.moveTo(crackX, crackY);
                        ctx.lineTo(crackX + Math.random() * 10 - 5, crackY + Math.random() * 10 - 5);
                        ctx.strokeStyle = 'black';
                        ctx.stroke();
                    }
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
                    ctx.strokeStyle = 'yellow';
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
        };

        canvas.addEventListener('click', this.handleCanvasClick);
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
                this.props.inputReceived(message);
                console.log('Move command sent:', message);
            }
        }
    }

    render() {
        return (
            <div>
                <h1>Yumerts Canvas</h1>
                <p>{this.state.exampleState}</p>
                <canvas ref={this.canvasRef} width="500" height="500"></canvas>
            </div>
        );
    }
}

export default YumertsCanvas;
