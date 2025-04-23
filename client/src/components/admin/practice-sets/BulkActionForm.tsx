import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

import { BulkActionFormValues, typeOptions, difficultyOptions } from "./types";

interface BulkActionFormProps {
  onSubmit: (data: BulkActionFormValues) => void;
  isPending: boolean;
}

const BulkActionForm: React.FC<BulkActionFormProps> = ({
  onSubmit,
  isPending,
}) => {
  const form = useForm<BulkActionFormValues>({
    defaultValues: {}
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {typeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficulty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Difficulty Level</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                value={field.value?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="No change" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {difficultyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublished"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between space-y-0 rounded-md border p-3">
              <div>
                <FormLabel>Published</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Update published status for selected practice sets
                </p>
              </div>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">No</span>
                  <Switch
                    checked={field.value === true}
                    onCheckedChange={(checked) => {
                      if (checked === (field.value === true)) return;
                      field.onChange(checked ? true : false);
                    }}
                  />
                  <span className="text-sm text-muted-foreground">Yes</span>
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Apply to Selected
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BulkActionForm;