import React, { useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QuantTopic } from './types';
import { PlusCircle, Edit, ChevronRight, ChevronDown } from 'lucide-react';
import { 
  BookOpen, Sigma, Brain, Lightbulb, PieChart,
  Code, Map, LayoutGrid, CheckCircle, FileText, HelpCircle,
  Calculator, Hash
} from 'lucide-react';

// Icon mapping for node display
const iconMap: Record<string, React.ReactNode> = {
  'book': <BookOpen size={16} />,
  'calculator': <Calculator size={16} />,
  'sigma': <Sigma size={16} />,
  'brain': <Brain size={16} />,
  'lightbulb': <Lightbulb size={16} />,
  'piechart': <PieChart size={16} />,
  'code': <Code size={16} />,
  'map': <Map size={16} />,
  'grid': <LayoutGrid size={16} />,
  'check': <CheckCircle size={16} />,
  'file': <FileText size={16} />,
  'help': <HelpCircle size={16} />,
};

// Category color mapping
const categoryColors: Record<string, string> = {
  'arithmetic': '#06b6d4',
  'algebra': '#ec4899',
  'geometry': '#8b5cf6',
  'data-analysis': '#f59e0b',
  'word-problems': '#10b981',
};

interface TopicRelationshipGraphProps {
  topics: QuantTopic[];
  onEditTopic: (topic: QuantTopic) => void;
  onCreateTopic: () => void;
}

const TopicRelationshipGraph: React.FC<TopicRelationshipGraphProps> = ({ 
  topics, 
  onEditTopic,
  onCreateTopic
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<number>>(new Set());
  
  // Toggle group expansion
  const toggleGroupExpansion = (groupNumber: number) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupNumber)) {
        newSet.delete(groupNumber);
      } else {
        newSet.add(groupNumber);
      }
      return newSet;
    });
  };
  
  // Select a topic
  const toggleTopicSelection = (topicId: number) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  };

  // Group topics by group number
  const groupedTopics = topics.reduce<Record<number, QuantTopic[]>>((acc, topic) => {
    const group = topic.groupNumber;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(topic);
    return acc;
  }, {});

  // Sort groups by key
  const sortedGroups = Object.keys(groupedTopics)
    .map(Number)
    .sort((a, b) => a - b);

  // Initialize nodes and edges when topics change or groups are expanded/collapsed
  useEffect(() => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    
    let yOffset = 50;
    const xOffset = 200;
    const nodeWidth = 180;
    const nodeHeight = 40;
    const nodeSpacing = 20;
    
    // Create group header nodes and topic nodes
    sortedGroups.forEach((groupNumber, groupIndex) => {
      const isExpanded = expandedGroups.has(groupNumber);
      const topics = groupedTopics[groupNumber].sort((a, b) => a.order - b.order);
      
      // Create group header node
      const groupNodeId = `group-${groupNumber}`;
      const groupNodeX = 150;
      const groupNodeY = yOffset;
      
      newNodes.push({
        id: groupNodeId,
        data: { 
          label: `Group ${groupNumber}`,
          count: topics.length,
          isExpanded,
          onToggle: () => toggleGroupExpansion(groupNumber)
        },
        position: { x: groupNodeX, y: groupNodeY },
        type: 'groupHeader',
        draggable: false,
        style: {
          width: 250,
          borderRadius: '8px',
          border: '1px solid #cbd5e1',
          padding: '8px 12px',
          background: '#f8fafc',
        }
      });
      
      yOffset += 70; // Space after group header
      
      // If group is expanded, add topic nodes
      if (isExpanded) {
        topics.forEach((topic, topicIndex) => {
          const nodeId = `topic-${topic.id}`;
          const nodeY = yOffset + topicIndex * (nodeHeight + nodeSpacing);
          
          newNodes.push({
            id: nodeId,
            data: { 
              topic,
              isSelected: selectedTopics.has(topic.id),
              onSelect: () => toggleTopicSelection(topic.id),
              onEdit: () => onEditTopic(topic)
            },
            position: { x: groupNodeX + 50, y: nodeY },
            type: 'topic',
            draggable: false,
            style: {
              width: nodeWidth,
              height: 'auto',
              background: `${topic.id === selectedTopics.values().next().value ? '#f1f5f9' : 'white'}`,
              borderRadius: '6px',
              border: `1px solid ${selectedTopics.has(topic.id) ? '#3b82f6' : '#cbd5e1'}`,
              boxShadow: selectedTopics.has(topic.id) ? '0 0 0 1px #3b82f6' : 'none',
            }
          });
          
          // Create edges for prerequisites
          if (topic.prerequisites) {
            const prereqIds = topic.prerequisites
              .split(',')
              .map(id => parseInt(id.trim(), 10))
              .filter(id => !isNaN(id));
              
            prereqIds.forEach(prereqId => {
              newEdges.push({
                id: `edge-${prereqId}-${topic.id}`,
                source: `topic-${prereqId}`,
                target: nodeId,
                type: 'smoothstep',
                markerEnd: { type: MarkerType.ArrowClosed },
                style: { stroke: '#94a3b8' },
              });
            });
          }
        });
        
        // Update offset for next group
        yOffset += topics.length * (nodeHeight + nodeSpacing) + 50;
      } else {
        // Just add spacing for collapsed group
        yOffset += 30;
      }
    });
    
    setNodes(newNodes);
    setEdges(newEdges);
  }, [topics, expandedGroups, selectedTopics, groupedTopics, sortedGroups]);

  // Custom node types
  const nodeTypes = {
    groupHeader: ({ data }) => (
      <div className="flex items-center justify-between px-4 py-2 bg-background border rounded-md cursor-pointer"
           onClick={data.onToggle}>
        <div className="flex items-center">
          {data.isExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />}
          <span className="font-medium">{data.label}</span>
        </div>
        <span className="text-xs bg-secondary px-2 py-1 rounded-full">{data.count} topics</span>
      </div>
    ),
    topic: ({ data }) => {
      const { topic, isSelected, onSelect, onEdit } = data;
      const categoryColor = categoryColors[topic.category] || '#64748b';
      const icon = topic.icon ? iconMap[topic.icon] || <Hash size={16} /> : <Hash size={16} />;
      
      return (
        <div 
          className={`flex flex-col px-3 py-2 bg-card border rounded-md hover:bg-accent/10 transition-colors ${isSelected ? 'ring-1 ring-primary' : ''}`}
          onClick={() => onSelect()}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2" style={{ color: categoryColor }}>{icon}</span>
              <span className="font-medium truncate max-w-[110px]">{topic.title}</span>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">{topic.description}</p>
        </div>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Topic Relationships</CardTitle>
        <Button variant="outline" size="sm" onClick={onCreateTopic}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Topic
        </Button>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md" style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
            proOptions={{ hideAttribution: true }}
          >
            <Controls />
            <MiniMap zoomable pannable />
            <Background color="#f1f5f9" gap={16} />
          </ReactFlow>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <p>The graph shows relationships between topics. Connect topics by selecting prerequisites when editing a topic.</p>
          <p className="mt-1"><strong>Note:</strong> A topic can only have prerequisites from the same or lower group numbers to avoid circular dependencies.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicRelationshipGraph;