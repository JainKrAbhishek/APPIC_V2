import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
  accessRuleSchema, 
  AccessRuleFormValues, 
  contentTypeOptions, 
  userTypeOptions 
} from "./types";

interface AccessRuleFormProps {
  onSubmit: (data: AccessRuleFormValues) => void;
  isSubmitting: boolean;
}

const AccessRuleForm: React.FC<AccessRuleFormProps> = ({ onSubmit, isSubmitting }) => {
  // Initialize the form
  const form = useForm<AccessRuleFormValues>({
    resolver: zodResolver(accessRuleSchema),
    defaultValues: {
      contentType: "quant_topic",
      contentId: 0,
      userType: "free",
      isAccessible: true,
      dailyWordLimit: 10, // Default limit for free users
    },
  });

  // Get vocabulary days
  const { data: vocabularyDays = [] } = useQuery<number[]>({
    queryKey: ["/api/words/days"],
    queryFn: async () => {
      return await apiRequest("/api/words/days");
    }
  });

  // Reset content ID when content type changes
  useEffect(() => {
    const contentType = form.getValues("contentType");
    if (contentType === "vocabulary_day" && vocabularyDays.length > 0) {
      // Set the content ID to the first vocabulary day if available
      form.setValue("contentId", vocabularyDays[0]);
      
      // Set default word limit based on user type
      const userType = form.getValues("userType");
      let defaultLimit = 10;
      if (userType === "premium") defaultLimit = 30;
      if (userType === "business") defaultLimit = 100;
      if (userType === "admin") defaultLimit = 0;
      form.setValue("dailyWordLimit", defaultLimit);
    } else if (contentType === "vocabulary_day" && form.getValues("contentId") === 0) {
      // If no vocabulary days loaded yet, but content type is vocabulary_day, set contentId to 1
      form.setValue("contentId", 1);
    } else if (contentType !== "vocabulary_day") {
      // For non-vocabulary content types, reset to 0 to ensure user enters a valid ID
      form.setValue("contentId", 0);
    }
  }, [form.watch("contentType"), vocabularyDays]);

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
                defaultValue={field.value}
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
          name="contentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1">
                Content ID
                {form.getValues("contentType") === "vocabulary_day" && (
                  <span className="text-sm font-normal text-muted-foreground">
                    (Vocabulary Day)
                  </span>
                )}
              </FormLabel>
              {form.getValues("contentType") === "vocabulary_day" ? (
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vocabulary day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vocabularyDays.map(day => (
                      <SelectItem key={day} value={day.toString()}>
                        Day {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input {...field} type="number" min="1" />
                </FormControl>
              )}
              <FormDescription>
                The specific content item to configure access for
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
                defaultValue={field.value}
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
                    ? 'Users of this type can access this content' 
                    : 'Users of this type cannot access this content'}
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

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create Access Rule"}
        </Button>
      </form>
    </Form>
  );
};

export default AccessRuleForm;