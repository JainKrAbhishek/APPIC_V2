import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { WordFormProps, WordFormValues, wordSchema } from "./types";
import { Save, X, Info } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const WordForm: React.FC<WordFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  isEditing
}) => {
  const form = useForm<WordFormValues>({
    resolver: zodResolver(wordSchema),
    defaultValues,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        <DialogHeader className="bg-slate-50 px-6 py-4 border-b">
          <DialogTitle className="text-lg font-medium">
            {isEditing ? "Edit Word" : "Add New Word"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Fill in word details for GRE preparation
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="word"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Word</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="E.g.: abound, amorphous" 
                        className="h-10 text-base" 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="definition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Definition</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Word definition" 
                        rows={3} 
                        className="text-base min-h-[80px] resize-y" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs flex items-center text-slate-500">
                      <Info className="h-3 w-3 mr-1" />
                      Add a clear and concise definition
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="example"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Example Sentence</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Example sentence containing the word" 
                        rows={2} 
                        className="text-base min-h-[70px] resize-y" 
                      />
                    </FormControl>
                    <FormDescription className="text-xs flex items-center text-slate-500">
                      <Info className="h-3 w-3 mr-1" />
                      You can highlight the word using &lt;u&gt;underlined&lt;/u&gt; tags
                    </FormDescription>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pronunciation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Pronunciation (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="E.g.: verb. Synonyms: proliferate, thrive, flourish" 
                        className="h-10 text-base" 
                      />
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="day"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Day</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger className="h-10 text-base">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <div className="max-h-[200px] overflow-y-auto">
                            {Array.from({ length: 34 }, (_, i) => i + 1).map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                Day {day}
                              </SelectItem>
                            ))}
                          </div>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                          className="h-10 text-base"
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </form>
          
          <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 gap-1"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button 
              type="submit" 
              onClick={form.handleSubmit(onSubmit)}
              className="h-10 gap-1 bg-emerald-600 hover:bg-emerald-700"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span>{isEditing ? "Save" : "Add Word"}</span>
            </Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default WordForm;