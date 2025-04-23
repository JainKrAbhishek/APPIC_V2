import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

import { 
  bulkActionSchema, 
  BulkActionFormValues, 
  contentTypeOptions, 
  userTypeOptions 
} from "./types";

interface BulkActionFormProps {
  onSubmit: (data: BulkActionFormValues) => void;
  isSubmitting: boolean;
  selectedItemsCount: number;
  selectedContentType: string;
  selectedUserType: string;
}

const BulkActionForm: React.FC<BulkActionFormProps> = ({ 
  onSubmit, 
  isSubmitting, 
  selectedItemsCount,
  selectedContentType,
  selectedUserType
}) => {
  // Initialize the form
  const form = useForm<BulkActionFormValues>({
    resolver: zodResolver(bulkActionSchema),
    defaultValues: {
      contentType: selectedContentType,
      userType: selectedUserType,
      isAccessible: true,
      contentIds: [],
      dailyWordLimit: 10, // Default limit for free users
    },
  });

  // Update form values when props change
  useEffect(() => {
    form.setValue("contentType", selectedContentType);
    form.setValue("userType", selectedUserType);
    
    // Set default word limit based on selected user type for bulk form
    if (selectedContentType === "vocabulary_day") {
      let defaultLimit = 10;
      if (selectedUserType === "premium") defaultLimit = 30;
      if (selectedUserType === "business") defaultLimit = 100;
      if (selectedUserType === "admin") defaultLimit = 0;
      form.setValue("dailyWordLimit", defaultLimit);
    }
  }, [selectedContentType, selectedUserType, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="contentType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select content type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {contentTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of content to control access for
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>User Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                The type of user that this rule applies to
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isAccessible"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">
                  {field.value ? 'Accessible' : 'Not Accessible'}
                </FormLabel>
                <FormDescription>
                  {field.value 
                    ? `Users of this type can access these ${selectedItemsCount} items` 
                    : `Users of this type cannot access these ${selectedItemsCount} items`}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {form.watch("contentType") === "vocabulary_day" && (
          <FormField
            control={form.control}
            name="dailyWordLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Word Limit</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    min="0" 
                    max="100"
                    placeholder="Enter word limit"
                  />
                </FormControl>
                <FormDescription>
                  Maximum number of words users can learn per day (0 = unlimited)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button type="submit" disabled={isSubmitting || selectedItemsCount === 0}>
          {isSubmitting ? "Creating..." : `Apply to ${selectedItemsCount} items`}
        </Button>
      </form>
    </Form>
  );
};

export default BulkActionForm;