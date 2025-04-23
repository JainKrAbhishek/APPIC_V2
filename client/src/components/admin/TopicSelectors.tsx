import { useQuery } from "@tanstack/react-query";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface TopicSelectorProps {
  questionType: string;
  category: string | undefined;
  value: string;
  onChange: (value: string) => void;
}

export const TopicSelector: React.FC<TopicSelectorProps> = ({
  questionType,
  category,
  value,
  onChange
}) => {
  const { data: quantTopics, isLoading: loadingQuant } = useQuery({
    queryKey: ["/api/quant/topics"],
    queryFn: async () => {
      const response = await fetch("/api/quant/topics");
      if (!response.ok) {
        throw new Error("Failed to fetch quantitative topics");
      }
      return response.json() as Promise<QuantTopic[]>;
    },
    enabled: questionType === "quantitative"
  });

  const { data: verbalTopics, isLoading: loadingVerbal } = useQuery({
    queryKey: ["/api/verbal/topics"],
    queryFn: async () => {
      const response = await fetch("/api/verbal/topics");
      if (!response.ok) {
        throw new Error("Failed to fetch verbal topics");
      }
      return response.json() as Promise<VerbalTopic[]>;
    },
    enabled: questionType === "verbal"
  });

  const isLoading = 
    (questionType === "quantitative" && loadingQuant) || 
    (questionType === "verbal" && loadingVerbal);

  // Filter topics based on question type and category
  const getQuantTopics = (): QuantTopic[] => {
    if (!quantTopics) return [];
    return category 
      ? quantTopics.filter(topic => topic.category === category)
      : quantTopics;
  };
  
  const getVerbalTopics = (): VerbalTopic[] => {
    if (!verbalTopics) return [];
    // Map verbal categories to types in the database
    const typeMap: Record<string, string> = {
      "reading": "reading_comprehension",
      "text_completion": "text_completion",
      "sentence_equivalence": "sentence_equivalence",
      "critical_reasoning": "critical_reasoning"
    };
    
    const mappedType = category ? typeMap[category] : undefined;
    return mappedType 
      ? verbalTopics.filter(topic => topic.type === mappedType)
      : verbalTopics;
  };
  
  // Get the appropriate topics based on question type
  const getTopics = () => {
    if (questionType === "quantitative") {
      return getQuantTopics();
    } else if (questionType === "verbal") {
      return getVerbalTopics();
    }
    return [];
  };

  return (
    <Select
      value={value}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a topic">
          {isLoading ? (
            <div className="flex items-center">
              <Spinner size="xs" className="mr-2" />
              <span>Loading topics...</span>
            </div>
          ) : (
            value || "Select a topic"
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-2">
            <Spinner size="sm" className="mr-2" />
            <span>Loading topics...</span>
          </div>
        ) : getTopics().length === 0 ? (
          <div className="p-2 text-sm text-muted-foreground text-center">
            {category 
              ? "No topics available for this category" 
              : "Select a category first"}
          </div>
        ) : (
          questionType === "quantitative" 
            ? getQuantTopics().map((topic) => (
                <SelectItem key={topic.id} value={String(topic.id)}>
                  {topic.title || topic.name}
                </SelectItem>
              ))
            : getVerbalTopics().map((topic) => (
                <SelectItem key={topic.id} value={String(topic.id)}>
                  {topic.title || topic.name}
                </SelectItem>
              ))
        )}
      </SelectContent>
    </Select>
  );
};