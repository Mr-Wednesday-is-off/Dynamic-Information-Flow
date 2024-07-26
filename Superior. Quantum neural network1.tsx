import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';

const levels = ['Quantum', 'Molecular', 'Cellular', 'Organismal'];
const nodeColors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63'];

const MAX_PARTICLES = 50;

const VisualizationComponent = () => {
  const [activeModes, setActiveModes] = useState([]);
  const [particles, setParticles] = useState([]);
  const [complexity, setComplexity] = useState(5);
  const [coupling, setCoupling] = useState([1, 1, 1]);
  const [lineColors, setLineColors] = useState({});
  const [description, setDescription] = useState('');
  const [optimalComplexity, setOptimalComplexity] = useState(5);
  const [isCritical, setIsCritical] = useState(false);
  const animationRef = useRef();
  const svgRef = useRef();
  const criticalityOpacityRef = useRef(0);

  const calculateOptimalComplexity = useCallback(() => {
    const averageCoupling = coupling.reduce((sum, c) => sum + c, 0) / coupling.length;
    return Math.round(averageCoupling * 2 + 2);
  }, [coupling]);

  useEffect(() => {
    const newOptimalComplexity = calculateOptimalComplexity();
    setOptimalComplexity(newOptimalComplexity);
    setIsCritical(complexity === newOptimalComplexity);
  }, [complexity, calculateOptimalComplexity]);

  const getNodePosition = useCallback((level, node) => ({
    x: (800 / (levels.length + 1)) * (level + 1),
    y: (600 / (complexity + 1)) * (node + 1)
  }), [complexity]);

  const createParticle = useCallback((startLevel, startNode, endLevel, endNode, color, shape = 'circle') => ({
    startLevel,
    startNode,
    endLevel,
    endNode,
    progress: 0,
    color,
    shape,
    key: Math.random(),
    history: []
  }), []);

  const updateLineColor = useCallback((startLevel, startNode, endLevel, endNode, color) => {
    const key = `${startLevel}-${startNode}-${endLevel}-${endNode}`;
    setLineColors(prev => {
      const newColors = {...prev};
      if (!newColors[key]) {
        newColors[key] = { count: 0, color: color };
      }
      newColors[key].count++;
      if (newColors[key].count > 5) {
        newColors[key].color = color;
      }
      return newColors;
    });
  }, []);

  const animate = useCallback((time) => {
    setParticles(prevParticles => {
      const updatedParticles = prevParticles
        .map(p => {
          const newProgress = p.progress + 0.02 * coupling[Math.min(p.startLevel, p.endLevel)];
          if (newProgress > 1) {
            if (activeModes.includes('Emergence') || 
                (activeModes.includes('Feedback Loop') && coupling[Math.min(p.startLevel, p.endLevel)] === 2)) {
              updateLineColor(p.startLevel, p.startNode, p.endLevel, p.endNode, p.color);
            }
            return null;
          }
          const start = getNodePosition(p.startLevel, p.startNode);
          const end = getNodePosition(p.endLevel, p.endNode);
          const x = start.x + (end.x - start.x) * newProgress;
          const y = start.y + (end.y - start.y) * newProgress;
          return {...p, progress: newProgress, history: [...p.history.slice(-5), {x, y}]};
        })
        .filter(Boolean);

      while (updatedParticles.length < MAX_PARTICLES && Math.random() < 0.1) {
        const startLevel = Math.floor(Math.random() * 4);
        const startNode = Math.floor(Math.random() * complexity);
        let endLevel, endNode, color, shape;

        if (activeModes.includes('Feedback Loop')) {
          endLevel = Math.floor(Math.random() * 4);
          endNode = Math.floor(Math.random() * complexity);
          color = nodeColors[startLevel];
          shape = coupling[Math.min(startLevel, endLevel)] === 2 ? 'diamond' : 'circle';
        } else if (activeModes.includes('Emergence')) {
          endLevel = (startLevel + 1) % 4;
          endNode = Math.floor(Math.random() * complexity);
          color = nodeColors[startLevel];
          shape = Math.random() < coupling[startLevel] * 0.2 ? 'diamond' : 'circle';
        } else if (activeModes.includes('Energy Flow')) {
          if (Math.random() < 0.9) {
            endLevel = Math.min(3, startLevel + 1);
          } else {
            endLevel = Math.max(0, startLevel - 1);
          }
          endNode = Math.floor(Math.random() * complexity);
          color = endLevel < startLevel ? nodeColors[startLevel] : nodeColors[endLevel];
        }

        if (Math.random() < coupling[Math.min(startLevel, endLevel)] * 0.5) {
          updatedParticles.push(createParticle(startLevel, startNode, endLevel, endNode, color, shape));
        }
      }

      return updatedParticles;
    });

    // Animate criticality text
    if (isCritical) {
      criticalityOpacityRef.current = Math.sin(time * 0.002) * 0.5 + 0.5;
    } else {
      criticalityOpacityRef.current = 0;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [activeModes, complexity, coupling, getNodePosition, updateLineColor, createParticle, isCritical]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [animate]);

  const toggleMode = useCallback((mode) => {
    setActiveModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
    switch (mode) {
      case 'Energy Flow':
        setDescription("Energy Flow: Represents the transfer of energy between different levels of the system.");
        break;
      case 'Emergence':
        setDescription("Emergence: Shows how complex behaviors arise from simple interactions at lower levels.");
        break;
      case 'Feedback Loop':
        setDescription("Feedback Loop: Illustrates how outputs of a system are routed back as inputs, influencing the system's behavior.");
        break;
    }
  }, []);

  const reset = useCallback(() => {
    setActiveModes([]);
    setParticles([]);
    setComplexity(5);
    setCoupling([1, 1, 1]);
    setLineColors({});
    setDescription("");
  }, []);

  const renderParticle = useCallback((particle, x, y) => {
    switch(particle.shape) {
      case 'diamond':
        return <polygon points={`${x},${y-4} ${x+4},${y} ${x},${y+4} ${x-4},${y}`} fill={particle.color} />;
      default:
        return <circle cx={x} cy={y} r="3" fill={particle.color} />;
    }
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg">
      <h2 className="text-2xl font-bold mb-4 text-center">Dynamic Information Flow Visualization</h2>
      <div className="flex justify-center space-x-4 mb-4">
        {['Energy Flow', 'Emergence', 'Feedback Loop'].map(mode => (
          <button
            key={mode}
            className={`px-4 py-2 rounded ${activeModes.includes(mode) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => toggleMode(mode)}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">
          Complexity Level: {complexity} (Optimal: {optimalComplexity})
        </label>
        <input
          type="range"
          min="2"
          max="6"
          value={complexity}
          onChange={(e) => setComplexity(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>
      {['Quantum - Molecular', 'Molecular - Cellular', 'Cellular - Organismal'].map((label, index) => (
        <div key={label} className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Coupling {label}: {coupling[index].toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={coupling[index]}
            onChange={(e) => {
              const newCoupling = [...coupling];
              newCoupling[index] = Number(e.target.value);
              setCoupling(newCoupling);
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      ))}
      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-96 border border-gray-300 mb-4">
        <rect x="0" y="0" width="800" height="600" fill={`rgba(200, 200, 200, ${Math.sin(Date.now() * 0.001) * 0.05 + 0.1})`} />
        {isCritical && (
          <rect x="0" y="0" width="800" height="600" fill="rgba(0, 255, 0, 0.2)" />
        )}
        {levels.map((level, levelIndex) => (
          <g key={level}>
            <text 
              x={(800 / (levels.length + 1)) * (levelIndex + 1)}
              y="30" 
              className="text-lg font-bold"
              textAnchor="middle" 
            >
              {level}
            </text>
            {[...Array(complexity)].map((_, nodeIndex) => (
              <g key={`${level}-${nodeIndex}`}>
                <circle 
                  cx={getNodePosition(levelIndex, nodeIndex).x}
                  cy={getNodePosition(levelIndex, nodeIndex).y}
                  r="20" 
                  fill={nodeColors[levelIndex]}
                />
                <text 
                  x={getNodePosition(levelIndex, nodeIndex).x}
                  y={getNodePosition(levelIndex, nodeIndex).y + 30}
                  textAnchor="middle" 
                  className="text-xs"
                >
                  {`Node ${nodeIndex + 1}`}
                </text>
              </g>
            ))}
          </g>
        ))}
        {levels.map((_, levelIndex) => 
          levels.map((_, nextLevelIndex) => 
            [...Array(complexity)].map((_, nodeIndex) => 
              [...Array(complexity)].map((_, nextNodeIndex) => {
                const strokeWidth = Math.abs(levelIndex - nextLevelIndex) === 1 
                  ? coupling[Math.min(levelIndex, nextLevelIndex)] 
                  : 0.1;
                const lineKey = `${levelIndex}-${nodeIndex}-${nextLevelIndex}-${nextNodeIndex}`;
                const lineColor = (activeModes.includes('Emergence') || (activeModes.includes('Feedback Loop') && coupling[Math.min(levelIndex, nextLevelIndex)] === 2)) && lineColors[lineKey]
                  ? lineColors[lineKey].color
                  : (activeModes.length === 0 ? 'rgba(100, 100, 100, 0.3)' : 'rgba(100, 100, 100, 0.1)');
                return (
                  <line
                    key={lineKey}
                    x1={getNodePosition(levelIndex, nodeIndex).x}
                    y1={getNodePosition(levelIndex, nodeIndex).y}
                    x2={getNodePosition(nextLevelIndex, nextNodeIndex).x}
                    y2={getNodePosition(nextLevelIndex, nextNodeIndex).y}
                    stroke={lineColor}
                    strokeWidth={strokeWidth}
                  />
                );
              })
            )
          )
        )}
        {particles.map((particle) => {
          const start = getNodePosition(particle.startLevel, particle.startNode);
          const end = getNodePosition(particle.endLevel, particle.endNode);
          const x = start.x + (end.x - start.x) * particle.progress;
          const y = start.y + (end.y - start.y) * particle.progress;
          return (
            <g key={particle.key}>
              {particle.history.map((pos, index) => (
                <circle
                  key={index}
                  cx={pos.x}
                  cy={pos.y}
                  r={1 + index * 0.2}
                  fill={particle.color}
                  opacity={(index + 1) / 10}
                />
              ))}
              {renderParticle(particle, x, y)}
            </g>
          );
        })}
        {isCritical && (
          <text 
            x="400" 
            y="300" 
            textAnchor="middle" 
            className="text-4xl font-bold" 
            fill={`rgba(255, 0, 0, ${criticalityOpacityRef.current})`}
          >
            CRITICALITY
          </text>
        )}
      </svg>
      <div className="flex justify-center mt-4">
        <button
          className="flex items-center px-4 py-2 rounded bg-gray-200"
          onClick={reset}
        >
          <RefreshCcw className="mr-2" /> Reset
        </button>
      </div>
      <div className="mt-4 p-2 bg-white border border-gray-300 rounded">
        {description}
      </div>
    </div>
  );
};

export default VisualizationComponent;
