import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Select, 
  SelectContent, 
  SelectGroup,
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  SelectLabel 
} from "@/components/ui/select";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Spinner } from "@/components/ui/spinner";

// Define local interfaces for compatibility that include both name and title fields
interface QuantTopic {
  id: number;
  name: string;           // From database schema
  description: string;
  category: string;
  groupNumber: number;
  order: number;
  title?: string;         // For compatibility with other components
}

interface VerbalTopic {
  id: number;
  title: string;          // From database schema
  description: string;
  type: string;
  order: number;
  name?: string;          // For compatibility with other components
}

interface QuestionTopicSelectorProps {
  questionType: "quantitative" | "verbal" | "vocabulary";
  category: string;
  value: string;
  onChange: (value: string) => void;
  name: string;
  control?: any;
  label?: string;
  error?: string | undefined;
}

const QuestionTopicSelector: React.FC<QuestionTopicSelectorProps> = ({
  questionType,
  category,
  value,
  onChange,
  name,
  control,
  label = "Topic",
  error
}) => {
  const [filteredTopics, setFilteredTopics] = useState<Array<QuantTopic | VerbalTopic>>([]);

  // Fetch quantitative topics
  const { data: quantTopics, isLoading: loadingQuant } = useQuery<QuantTopic[]>({
    queryKey: ["/api/quant/topics"],
    enabled: questionType === "quantitative",
    initialData: []
  });

  // Fetch verbal topics
  const { data: verbalTopics, isLoading: loadingVerbal } = useQuery<VerbalTopic[]>({
    queryKey: ["/api/verbal/topics"],
    enabled: questionType === "verbal",
    initialData: []
  });

  // Map verbal categories to topic types in database
  const verbalCategoryToType: Record<string, string> = {
    "reading": "reading_comprehension",
    "text_completion": "text_completion",
    "sentence_equivalence": "sentence_equivalence",
    "critical_reasoning": "critical_reasoning"
  };

  useEffect(() => {
    if (questionType === "quantitative" && quantTopics && Array.isArray(quantTopics)) {
      // Filter quantitative topics by category if category is provided
      const filtered = category
        ? quantTopics.filter((topic) => topic.category?.toLowerCase() === category.toLowerCase())
        : quantTopics;
      setFilteredTopics(filtered);
    } else if (questionType === "verbal" && verbalTopics && Array.isArray(verbalTopics)) {
      // For verbal topics, map the category to the corresponding type
      const mappedType = verbalCategoryToType[category] || category;
      const filtered = category
        ? verbalTopics.filter((topic) => topic.type?.toLowerCase() === mappedType.toLowerCase())
        : verbalTopics;
      setFilteredTopics(filtered);
    } else {
      setFilteredTopics([]);
    }
  }, [questionType, category, quantTopics, verbalTopics]);

  // Loading state
  if ((questionType === "quantitative" && loadingQuant) || (questionType === "verbal" && loadingVerbal)) {
    return (
      <FormItem>
        <FormLabel>{label}</FormLabel>
        <FormControl>
          <div className="flex items-center justify-center h-10 border rounded-md">
            <Spinner size="sm" />
          </div>
        </FormControl>
        {error && <FormMessage>{error}</FormMessage>}
      </FormItem>
    );
  }

  // Group topics by categories for better organization
  const groupedTopics = filteredTopics.reduce((acc, topic) => {
    // Determine the correct group key based on topic type
    let groupKey: string;
    
    if (questionType === "quantitative") {
      const quantTopic = topic as QuantTopic;
      groupKey = quantTopic.category || "Other";
    } else {
      const verbalTopic = topic as VerbalTopic;
      groupKey = verbalTopic.type || "Other";
    }
    
    if (!acc[groupKey]) {
      acc[groupKey] = [];
    }
    acc[groupKey].push(topic);
    return acc;
  }, {} as Record<string, Array<QuantTopic | VerbalTopic>>);

  // Sort groups by name for consistent display
  const sortedGroups = Object.keys(groupedTopics).sort();

  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <Select value={value} onValueChange={onChange}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a topic" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {filteredTopics.length === 0 ? (
            <div className="text-center py-2 text-sm text-muted-foreground">
              No topics available for this category
            </div>
          ) : (
            sortedGroups.map(group => (
              <SelectGroup key={group}>
                <SelectLabel>{group.charAt(0).toUpperCase() + group.slice(1).replace('_', ' ')}</SelectLabel>
                {groupedTopics[group].map((topic) => {
                  if (questionType === "quantitative") {
                    const quantTopic = topic as QuantTopic;
                    return (
                      <SelectItem key={quantTopic.id} value={String(quantTopic.id)}>
                        {quantTopic.title || quantTopic.name}
                      </SelectItem>
                    );
                  } else {
                    const verbalTopic = topic as VerbalTopic;
                    return (
                      <SelectItem key={verbalTopic.id} value={String(verbalTopic.id)}>
                        {verbalTopic.title || verbalTopic.name}
                      </SelectItem>
                    );
                  }
                })}
              </SelectGroup>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <FormMessage>{error}</FormMessage>}
    </FormItem>
  );
};

export default QuestionTopicSelector;