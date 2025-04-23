import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Loader2, BookOpen, Sigma, Brain, Lightbulb, PieChart,
  Code, Map, LayoutGrid, CheckCircle, FileText, HelpCircle,
  Calculator
} from "lucide-react";
import { Label } from "@/components/ui/label";

import { 
  QuantTopic, 
  QuantTopicFormValues, 
  quantTopicSchema, 
  categoryOptions 
} from "./types";

interface IconOption {
  value: string;
  label: string;
  icon: React.ReactNode;
}

const iconOptions: IconOption[] = [
  { value: "book", label: "Book", icon: <BookOpen className="h-4 w-4" /> },
  { value: "calculator", label: "Calculator", icon: <Calculator className="h-4 w-4" /> },
  { value: "sigma", label: "Sigma (Math)", icon: <Sigma className="h-4 w-4" /> },
  { value: "brain", label: "Brain", icon: <Brain className="h-4 w-4" /> },
  { value: "lightbulb", label: "Lightbulb", icon: <Lightbulb className="h-4 w-4" /> },
  { value: "piechart", label: "Pie Chart", icon: <PieChart className="h-4 w-4" /> },
  { value: "code", label: "Code", icon: <Code className="h-4 w-4" /> },
  { value: "map", label: "Map", icon: <Map className="h-4 w-4" /> },
  { value: "grid", label: "Grid", icon: <LayoutGrid className="h-4 w-4" /> },
  { value: "check", label: "Checkmark", icon: <CheckCircle className="h-4 w-4" /> },
  { value: "file", label: "Document", icon: <FileText className="h-4 w-4" /> },
  { value: "help", label: "Help", icon: <HelpCircle className="h-4 w-4" /> },
];

// Extended schema that includes prerequisites and icon
const extendedTopicSchema = quantTopicSchema.extend({
  prerequisites: z.string().optional(),
  icon: z.string().optional(),
});

type ExtendedQuantTopicFormValues = z.infer<typeof extendedTopicSchema>;

interface QuantTopicFormProps {
  onSubmit: (data: ExtendedQuantTopicFormValues) => void;
  editingTopic: QuantTopic | null;
  isPending: boolean;
  allTopics?: QuantTopic[];
}

const QuantTopicForm: React.FC<QuantTopicFormProps> = ({
  onSubmit,
  editingTopic,
  isPending,
  allTopics = []
}) => {
  const [selectedPrereqs, setSelectedPrereqs] = useState<number[]>([]);
  
  const form = useForm<ExtendedQuantTopicFormValues>({
    resolver: zodResolver(extendedTopicSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "arithmetic",
      groupNumber: 1,
      order: 1,
      prerequisites: "",
      icon: "book"
    },
  });

  // Initialize selected prerequisites from editing topic
  useEffect(() => {
    if (editingTopic?.prerequisites) {
      let prereqIds: number[] = [];
      
      // Handle different data types for prerequisites
      if (typeof editingTopic.prerequisites === 'string') {
        // If it's a string, split by comma
        prereqIds = editingTopic.prerequisites
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));
      } else if (Array.isArray(editingTopic.prerequisites)) {
        // If it's already an array, use it directly
        // Cast prerequisites to any to avoid type errors
        const prereqArray = editingTopic.prerequisites as any[];
        if (prereqArray && prereqArray.length > 0) {
          prereqIds = prereqArray
            .map((id: any) => typeof id === 'number' ? id : parseInt(String(id), 10))
            .filter((id: number) => !isNaN(id));
        }
      }
      
      setSelectedPrereqs(prereqIds);
    } else {
      setSelectedPrereqs([]);
    }
  }, [editingTopic]);

  // Update form when editing topic changes
  useEffect(() => {
    if (editingTopic) {
      form.reset({
        title: editingTopic.title,
        description: editingTopic.description,
        category: editingTopic.category,
        groupNumber: editingTopic.groupNumber,
        order: editingTopic.order,
        prerequisites: editingTopic.prerequisites || "",
        icon: editingTopic.icon || "book"
      });
    } else {
      form.reset({
        title: "",
        description: "",
        category: "arithmetic",
        groupNumber: 1,
        order: 1,
        prerequisites: "",
        icon: "book"
      });
    }
  }, [editingTopic, form]);

  // Filter out topics that would create circular dependencies
  const availablePrereqs = allTopics.filter(topic => 
    // Can't select self as prerequisite
    topic.id !== editingTopic?.id &&
    // Can't select topics with higher group numbers
    topic.groupNumber <= (editingTopic?.groupNumber || 1)
  );

  const togglePrerequisite = (topicId: number) => {
    setSelectedPrereqs(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const handleSubmit = (data: ExtendedQuantTopicFormValues) => {
    // Format prerequisites as comma-separated IDs
    data.prerequisites = selectedPrereqs.join(',');
    
    onSubmit(data);
    if (!editingTopic) {
      form.reset({
        title: "",
        description: "",
        category: "arithmetic",
        groupNumber: 1,
        order: 1,
        prerequisites: "",
        icon: "book"
      });
      setSelectedPrereqs([]);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter topic title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter topic description" 
                  rows={3} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4 items-center">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Category</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select topic category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          ></div>
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Topic Icon</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || "book"}
                  value={field.value || "book"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    <div className="grid grid-cols-2 gap-1">
                      {iconOptions.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          <div className="flex items-center">
                            {icon.icon}
                            <span className="ml-2">{icon.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4 items-center">
          <FormField
            control={form.control}
            name="groupNumber"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Group Number</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Topics in the same group are related
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Display Order</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={1} 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                  />
                </FormControl>
                <FormDescription className="text-xs">
                  Controls display order within a group
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-3 space-x-2 border-t">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTopic ? "Update Topic" : "Create Topic"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default QuantTopicForm;