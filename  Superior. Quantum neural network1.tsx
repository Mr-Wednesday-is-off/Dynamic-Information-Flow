import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Zap, RefreshCcw } from 'lucide-react';

const levels = ['Quantum', 'Molecular', 'Cellular', 'Organismal'];
const nodes = 5;

const VisualizationComponent = () => {
  const [highlightMode, setHighlightMode] = useState('none');
  const [particles, setParticles] = useState([]);
  const animationRef = useRef();
  const svgRef = useRef();

  useEffect(() => {
    if (highlightMode !== 'none') {
      animationRef.current = requestAnimationFrame(animate);
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [highlightMode, particles]);

  const getNodePosition = (level, node) => ({
    x: 160 * node + 100,
    y: 150 * level + 50
  });

  const createParticle = (startLevel, startNode, endLevel, endNode, color) => ({
    startLevel,
    startNode,
    endLevel,
    endNode,
    progress: 0,
    color,
    key: Math.random()
  });

  const animate = () => {
    setParticles(prevParticles => 
      prevParticles.map(p => ({
        ...p,
        progress: p.progress + 0.02
      })).filter(p => p.progress <= 1)
    );

    if (Math.random() < 0.1) {
      let newParticle;
      if (highlightMode === 'feedback') {
        const startLevel = Math.floor(Math.random() * 4);
        const endLevel = (startLevel + 1) % 4;
        newParticle = createParticle(startLevel, Math.floor(Math.random() * nodes), 
                                     endLevel, Math.floor(Math.random() * nodes), 'red');
      } else if (highlightMode === 'emergence') {
        const startLevel = Math.floor(Math.random() * 3);
        const endLevel = startLevel + 1;
        const startNode = Math.floor(Math.random() * nodes);
        const endNode = Math.floor(Math.random() * nodes);
        const startColor = ['blue', 'green', 'orange', 'red'][startLevel];
        const endColor = ['blue', 'green', 'orange', 'red'][endLevel];
        newParticle = createParticle(startLevel, startNode, endLevel, endNode, `url(#gradient-${startColor}-${endColor})`);
      } else if (highlightMode === 'energyFlow') {
        const startLevel = Math.floor(Math.random() * 3);
        let endLevel;
        if (Math.random() < 0.9) {
          endLevel = startLevel + 1;
        } else {
          endLevel = Math.max(0, startLevel - 1);
        }
        newParticle = createParticle(startLevel, Math.floor(Math.random() * nodes), 
                                     endLevel, Math.floor(Math.random() * nodes), 'yellow');
      }
      if (newParticle) setParticles(prev => [...prev, newParticle]);
    }

    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-96 border border-gray-300">
        <defs>
          {['blue', 'green', 'orange', 'red'].map((color, i) => 
            ['blue', 'green', 'orange', 'red'].map((nextColor, j) => 
              i < j && (
                <linearGradient key={`${color}-${nextColor}`} id={`gradient-${color}-${nextColor}`}>
                  <stop offset="0%" stopColor={color} />
                  <stop offset="100%" stopColor={nextColor} />
                </linearGradient>
              )
            )
          )}
        </defs>
        {levels.map((level, levelIndex) => (
          <g key={level}>
            <text x="10" y={150 * levelIndex + 50} className="text-lg font-bold">{level}</text>
            {[...Array(nodes)].map((_, nodeIndex) => (
              <g key={`${level}-${nodeIndex}`}>
                <circle 
                  cx={160 * nodeIndex + 100} 
                  cy={150 * levelIndex + 50} 
                  r="20" 
                  fill={['blue', 'green', 'orange', 'red'][levelIndex]}
                />
                <text 
                  x={160 * nodeIndex + 100} 
                  y={150 * levelIndex + 90} 
                  textAnchor="middle" 
                  className="text-xs"
                >
                  {`${level} node ${nodeIndex + 1}`}
                </text>
              </g>
            ))}
          </g>
        ))}
        {levels.map((_, levelIndex) => 
          levels.map((_, nextLevelIndex) => 
            [...Array(nodes)].map((_, nodeIndex) => 
              [...Array(nodes)].map((_, nextNodeIndex) => (
                <line
                  key={`${levelIndex}-${nodeIndex}-${nextLevelIndex}-${nextNodeIndex}`}
                  x1={160 * nodeIndex + 100}
                  y1={150 * levelIndex + 50}
                  x2={160 * nextNodeIndex + 100}
                  y2={150 * nextLevelIndex + 50}
                  stroke={highlightMode === 'none' ? 'rgba(200, 200, 200, 0.3)' : 'rgba(200, 200, 200, 0.1)'}
                  strokeWidth="1"
                />
              ))
            )
          )
        )}
        {particles.map((particle) => {
          const start = getNodePosition(particle.startLevel, particle.startNode);
          const end = getNodePosition(particle.endLevel, particle.endNode);
          const x = start.x + (end.x - start.x) * particle.progress;
          const y = start.y + (end.y - start.y) * particle.progress;
          return (
            <circle
              key={particle.key}
              cx={x}
              cy={y}
              r="5"
              fill={particle.color}
            />
          );
        })}
      </svg>
      <div className="flex justify-center mt-4 space-x-4">
        <button
          className={`flex items-center px-4 py-2 rounded ${highlightMode === 'feedback' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setHighlightMode(prev => prev === 'feedback' ? 'none' : 'feedback')}
        >
          <ArrowDownCircle className="mr-2" /> Feedback Loops
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded ${highlightMode === 'emergence' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setHighlightMode(prev => prev === 'emergence' ? 'none' : 'emergence')}
        >
          <ArrowUpCircle className="mr-2" /> Emergence
        </button>
        <button
          className={`flex items-center px-4 py-2 rounded ${highlightMode === 'energyFlow' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}
          onClick={() => setHighlightMode(prev => prev === 'energyFlow' ? 'none' : 'energyFlow')}
        >
          <Zap className="mr-2" /> Energy Flow
        </button>
        <button
          className="flex items-center px-4 py-2 rounded bg-gray-200"
          onClick={() => {
            setHighlightMode('none');
            setParticles([]);
          }}
        >
          <RefreshCcw className="mr-2" /> Reset
        </button>
      </div>
    </div>
  );
};

export default VisualizationComponent;
