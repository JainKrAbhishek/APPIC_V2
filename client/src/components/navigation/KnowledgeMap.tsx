import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { QuantTopic } from '@shared/schema';
import { useThemeLanguage } from '@/hooks/use-theme-language';

interface KnowledgeMapProps {
  topics: QuantTopic[];
  userProgress: Record<number, boolean>;
  onTopicSelect: (topicId: number) => void;
  groupColors: Record<string, string>;
  fullWidth?: boolean;
}

const KnowledgeMap: React.FC<KnowledgeMapProps> = ({
  topics,
  userProgress,
  onTopicSelect,
  groupColors,
  fullWidth = false,
}) => {
  const { t } = useThemeLanguage();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Node styling
  const getNodeStyle = useCallback((topic: QuantTopic) => {
    const isCompleted = userProgress[topic.id] || false;
    const groupColor = groupColors[topic.category] || '#6366f1';
    
    return {
      padding: 10,
      borderRadius: '8px',
      border: `2px solid ${groupColor}`,
      backgroundColor: isCompleted ? `${groupColor}` : 'white',
      color: isCompleted ? 'white' : 'black',
      width: 180,
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    };
  }, [userProgress, groupColors]);

  // Generate nodes and edges from topics
  useEffect(() => {
    if (!topics || topics.length === 0) return;

    // Group topics by category
    const categorizedTopics: Record<string, QuantTopic[]> = {};
    topics.forEach(topic => {
      if (!categorizedTopics[topic.category]) {
        categorizedTopics[topic.category] = [];
      }
      categorizedTopics[topic.category].push(topic);
    });

    // Categories to display in columns
    const categories = Object.keys(categorizedTopics);
    
    // Generate nodes
    const generatedNodes: Node[] = [];
    const generatedEdges: Edge[] = [];
    
    const horizontalSpacing = 300;
    const verticalSpacing = 120;
    
    // Create nodes for each topic
    categories.forEach((category, categoryIndex) => {
      const topicsInCategory = categorizedTopics[category].sort((a, b) => a.order - b.order);
      
      topicsInCategory.forEach((topic, topicIndex) => {
        const node: Node = {
          id: `${topic.id}`,
          data: { 
            label: topic.name,
            isCompleted: userProgress[topic.id] || false,
            topic: topic,
          },
          position: {
            x: categoryIndex * horizontalSpacing,
            y: topicIndex * verticalSpacing,
          },
          style: getNodeStyle(topic),
          sourcePosition: Position.Right,
          targetPosition: Position.Left,
          type: 'default',
        };
        
        generatedNodes.push(node);
        
        // Create edges based on prerequisites
        if (topic.prerequisites) {
          const prerequisiteIds = topic.prerequisites.split(',').map((p: string) => p.trim());
          prerequisiteIds.forEach((prerequisiteId: string) => {
            if (prerequisiteId) {
              generatedEdges.push({
                id: `e${prerequisiteId}-${topic.id}`,
                source: prerequisiteId,
                target: `${topic.id}`,
                markerEnd: {
                  type: MarkerType.ArrowClosed,
                },
                style: { stroke: '#888', strokeWidth: 2 },
                animated: userProgress[topic.id] || false,
              });
            }
          });
        }
      });
    });
    
    setNodes(generatedNodes);
    setEdges(generatedEdges);
  }, [topics, userProgress, getNodeStyle]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data?.topic?.id) {
      onTopicSelect(node.data.topic.id);
    }
  }, [onTopicSelect]);

  return (
    <div style={{ height: fullWidth ? '80vh' : '400px', width: '100%' }} data-testid="knowledge-map">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        nodesFocusable
        nodesConnectable={false}
        nodesDraggable={false}
      >
        <Controls />
        <Background />
        {fullWidth && <MiniMap />}
      </ReactFlow>
    </div>
  );
};

export default KnowledgeMap;