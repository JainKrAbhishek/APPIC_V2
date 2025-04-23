import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
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
import { Loader2 } from "lucide-react";

import { 
  VerbalTopic, 
  VerbalTopicFormValues, 
  verbalTopicSchema, 
  verbalTypeOptions 
} from "./types";

interface VerbalTopicFormProps {
  onSubmit: (data: VerbalTopicFormValues) => void;
  editingTopic: VerbalTopic | null;
  isPending: boolean;
}

const VerbalTopicForm: React.FC<VerbalTopicFormProps> = ({
  onSubmit,
  editingTopic,
  isPending,
}) => {
  const form = useForm<VerbalTopicFormValues>({
    resolver: zodResolver(verbalTopicSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "reading",
      order: 1,
    },
  });

  // Update form when editing topic changes
  useEffect(() => {
    if (editingTopic) {
      form.reset({
        title: editingTopic.title,
        description: editingTopic.description,
        type: editingTopic.type,
        order: editingTopic.order,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        type: "reading",
        order: 1,
      });
    }
  }, [editingTopic, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select topic type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {verbalTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
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
          name="order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Order</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min={1} 
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 space-x-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingTopic ? "Update Topic" : "Create Topic"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VerbalTopicForm;