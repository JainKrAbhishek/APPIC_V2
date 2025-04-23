import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { useEditorOperations } from '../hooks/editor-operations';
import { Image, Upload, Link, AlertCircle, Check, X, ImagePlus, LayoutGrid, Columns } from 'lucide-react';
import { cn } from '@/utils/ui-utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';

interface ImageMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type ImageMode = 'url' | 'upload' | 'library';

interface ImageSizePreset {
  label: string;
  width: string;
  height: string;
  icon: React.ReactNode;
}

/**
 * Component for inserting and configuring images with enhanced preview and drag-drop support
 */
const ImageMenu: React.FC<ImageMenuProps> = ({ isOpen, onClose }) => {
  const { insertImage } = useEditorOperations();
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [align, setAlign] = useState<'left' | 'center' | 'right'>('center');
  const [width, setWidth] = useState('50%');
  const [height, setHeight] = useState('auto');
  const [mode, setMode] = useState<ImageMode>('upload');
  const [error, setError] = useState<string | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('image');
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [isValidImage, setIsValidImage] = useState(false);
  const [imageQuality, setImageQuality] = useState<number>(80);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const previewImageRef = useRef<HTMLImageElement>(null);

  // Sample image library (in a real app, this would come from an API)
  const sampleImages = [
    { 
      url: 'https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Study space with books',
      thumb: 'https://images.unsplash.com/photo-1546514714-df0ccc50d7bf?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    { 
      url: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Math formula on blackboard',
      thumb: 'https://images.unsplash.com/photo-1513258496099-48168024aec0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    { 
      url: 'https://images.unsplash.com/photo-1588580000645-f93733f65b17?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Woman studying with laptop',
      thumb: 'https://images.unsplash.com/photo-1588580000645-f93733f65b17?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    { 
      url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Students in library',
      thumb: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    { 
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Person writing in notebook',
      thumb: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
    { 
      url: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      alt: 'Books on desk',
      thumb: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', 
    },
  ];

  // Size presets for images
  const sizePresets: ImageSizePreset[] = [
    { 
      label: 'Small', 
      width: '25%', 
      height: 'auto',
      icon: <span className="text-xs">S</span>
    },
    { 
      label: 'Medium', 
      width: '50%', 
      height: 'auto',
      icon: <span className="text-xs">M</span>
    },
    { 
      label: 'Large', 
      width: '75%', 
      height: 'auto',
      icon: <span className="text-xs">L</span>
    },
    { 
      label: 'Full Width', 
      width: '100%', 
      height: 'auto',
      icon: <LayoutGrid className="h-3 w-3" />
    },
    { 
      label: 'Two Column', 
      width: '48%', 
      height: 'auto',
      icon: <Columns className="h-3 w-3" />
    },
  ];

  // Reset form state when dialog opens or closes
  const resetForm = () => {
    setImageUrl('');
    setAltText('');
    setCaption('');
    setAlign('center');
    setWidth('50%');
    setHeight('auto');
    setAspectRatio(null);
    setNaturalWidth(null);
    setNaturalHeight(null);
    setIsValidImage(false);
    setError(null);
    setPreviewReady(false);
    setIsDragging(false);
    setActiveTab('image');
    setImageQuality(80);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Handle drag events for file upload
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, []);

  // Process file upload
  const processFile = (file: File) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, GIF, etc.)');
      return;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size should be less than 5MB');
      return;
    }

    // Create a local URL for the image
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    setError(null);
    setPreviewReady(false);
    setMode('upload');

    // Set alt text to filename if not provided
    if (!altText) {
      setAltText(file.name.split('.')[0].replace(/[-_]/g, ' '));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle image load to get dimensions
  const handleImageLoad = useCallback(() => {
    setPreviewReady(true);
    
    if (previewImageRef.current) {
      const img = previewImageRef.current;
      setNaturalWidth(img.naturalWidth);
      setNaturalHeight(img.naturalHeight);
      setAspectRatio(img.naturalWidth / img.naturalHeight);
      setIsValidImage(true);
    }
  }, []);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setPreviewReady(true);
    setIsValidImage(false);
    setError('Failed to load image. Please check the URL or try another image.');
  }, []);

  // Apply a size preset
  const applyPreset = (preset: ImageSizePreset) => {
    setWidth(preset.width);
    setHeight(preset.height);
  };

  // Handle URL validation
  const validateUrl = useCallback(() => {
    if (!imageUrl.trim()) {
      setError('Please enter an image URL');
      setPreviewReady(false);
      setIsValidImage(false);
      return;
    }

    // Basic URL validation
    try {
      new URL(imageUrl);
      setError(null);
    } catch (e) {
      setError('Please enter a valid URL');
      setPreviewReady(false);
      setIsValidImage(false);
      return;
    }

    setPreviewReady(false); // Reset until image loads
  }, [imageUrl]);

  // Trigger URL validation when the URL changes
  useEffect(() => {
    if (mode === 'url' && imageUrl) {
      validateUrl();
    }
  }, [mode, imageUrl, validateUrl]);

  // When library image is selected
  const selectLibraryImage = (image: typeof sampleImages[0]) => {
    setImageUrl(image.url);
    setAltText(image.alt);
    setMode('url');
    setPreviewReady(false);
    setError(null);
  };

  const handleSubmit = () => {
    // Validation
    if (!imageUrl.trim()) {
      setError('Please provide an image');
      return;
    }

    if (!isValidImage) {
      setError('Please provide a valid image');
      return;
    }

    // Create size object if custom dimensions are specified
    const size = { 
      width: width || '50%', 
      height: height || 'auto' 
    };

    // Insert the image
    insertImage({
      url: imageUrl,
      alt: altText,
      caption: caption || undefined,
      imageAlign: align,
      size,
    });

    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Insert Image</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="image" className="flex-1 overflow-hidden flex flex-col" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="image">Image Source</TabsTrigger>
            <TabsTrigger value="settings">Image Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="image" className="flex-1 overflow-hidden">
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex space-x-2">
                <Button
                  variant={mode === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('upload')}
                  className="flex items-center"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button
                  variant={mode === 'url' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('url')}
                  className="flex items-center"
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL
                </Button>
                <Button
                  variant={mode === 'library' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setMode('library')}
                  className="flex items-center"
                >
                  <Image className="h-4 w-4 mr-2" />
                  Library
                </Button>
              </div>
              
              {mode === 'upload' && (
                <div 
                  ref={dropZoneRef}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-600",
                    "flex-1"
                  )}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {!imageUrl ? (
                    <>
                      <ImagePlus className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-sm text-center mb-2">
                        Drag and drop an image here, or click to browse
                      </p>
                      <p className="text-xs text-gray-500 text-center mb-4">
                        Supports: JPG, PNG, GIF, WebP (Max 5MB)
                      </p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Browse Files
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </>
                  ) : (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="absolute top-0 right-0 flex space-x-2 p-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 w-8 p-0 rounded-full"
                          onClick={() => setImageUrl('')}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                      {previewReady ? (
                        isValidImage ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="max-h-[300px] max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="h-12 w-12 mb-2" />
                            <p>Failed to load image</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-pulse h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                          <p className="text-sm text-gray-500">Loading preview...</p>
                        </div>
                      )}
                      <img
                        ref={previewImageRef}
                        src={imageUrl}
                        alt="Hidden for dimension calculation"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
              
              {mode === 'url' && (
                <div className="space-y-4 flex-1 flex flex-col">
                  <div className="grid gap-2">
                    <Label htmlFor="image-url">Image URL</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="image-url"
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setError(null);
                          setPreviewReady(false);
                        }}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Button 
                        onClick={validateUrl} 
                        variant="outline"
                        size="icon"
                        type="button"
                        className="shrink-0"
                      >
                        <Check className="h-4 w-4" />
                        <span className="sr-only">Validate</span>
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex-1 flex flex-col items-center justify-center">
                    {imageUrl ? (
                      previewReady ? (
                        isValidImage ? (
                          <div className="flex items-center justify-center w-full h-full">
                            <img
                              src={imageUrl}
                              alt="Preview"
                              className="max-h-[300px] max-w-full object-contain"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="h-12 w-12 mb-2" />
                            <p>Failed to load image</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-pulse h-24 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"></div>
                          <p className="text-sm text-gray-500">Loading preview...</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center text-gray-500">
                        <Image className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Enter a URL to preview the image</p>
                      </div>
                    )}
                    <img
                      ref={previewImageRef}
                      src={imageUrl}
                      alt="Hidden for dimension calculation"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
              
              {mode === 'library' && (
                <div className="space-y-4 flex-1">
                  <ScrollArea className="h-[350px] rounded-md border">
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {sampleImages.map((image, index) => (
                        <Card 
                          key={index}
                          className={cn(
                            "cursor-pointer overflow-hidden",
                            imageUrl === image.url && "ring-2 ring-primary"
                          )}
                          onClick={() => selectLibraryImage(image)}
                        >
                          <CardContent className="p-2">
                            <div className="aspect-video overflow-hidden rounded-md mb-2">
                              <img 
                                src={image.thumb} 
                                alt={image.alt}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <p className="text-xs truncate">{image.alt}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
              
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setActiveTab('settings')}
                  disabled={!imageUrl || !isValidImage}
                  className="w-full"
                >
                  Continue to Image Settings
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="alt-text">Alt Text (for accessibility)</Label>
                  <Input
                    id="alt-text"
                    value={altText}
                    onChange={(e) => setAltText(e.target.value)}
                    placeholder="Description of the image"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="caption">Caption (optional)</Label>
                  <Input
                    id="caption"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Image caption"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="align">Alignment</Label>
                  <Select
                    value={align}
                    onValueChange={(value) => setAlign(value as 'left' | 'center' | 'right')}
                  >
                    <SelectTrigger id="align">
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label>Size Presets</Label>
                  <div className="flex flex-wrap gap-2">
                    {sizePresets.map((preset) => (
                      <Button
                        key={preset.label}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className={cn(
                          "flex items-center",
                          width === preset.width && "bg-primary/10"
                        )}
                      >
                        {preset.icon}
                        <span className="ml-1">{preset.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    placeholder="50%, 300px, etc."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="auto, 200px, etc."
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="quality">Quality ({imageQuality}%)</Label>
                  <Slider
                    id="quality"
                    min={10}
                    max={100}
                    step={5}
                    value={[imageQuality]}
                    onValueChange={(value) => setImageQuality(value[0])}
                  />
                  <p className="text-xs text-gray-500">
                    {imageQuality < 30 ? 'Low quality, smaller file size' : 
                     imageQuality < 70 ? 'Balanced quality and size' : 
                     'High quality, larger file size'}
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <Label>Preview</Label>
                <div className={cn(
                  "border rounded-lg p-4 h-[300px] overflow-hidden flex flex-col",
                  align === 'center' && "items-center",
                  align === 'right' && "items-end",
                  align === 'left' && "items-start"
                )}>
                  {isValidImage && imageUrl ? (
                    <>
                      <img
                        src={imageUrl}
                        alt={altText || "Preview"}
                        style={{ 
                          width: width || '50%', 
                          height: height || 'auto',
                          maxHeight: '250px'
                        }}
                        className="object-contain"
                      />
                      {caption && (
                        <div className="text-sm text-gray-500 mt-2 text-center">
                          {caption}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No preview available
                    </div>
                  )}
                </div>
                
                {naturalWidth && naturalHeight && (
                  <div className="text-xs text-gray-500">
                    Original dimensions: {naturalWidth} × {naturalHeight} pixels
                  </div>
                )}
                
                {aspectRatio && (
                  <div className="text-xs text-gray-500">
                    Aspect ratio: {aspectRatio.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setActiveTab('image')}
                className="w-full"
              >
                Back to Image Source
              </Button>
            </div>
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="flex items-center text-red-500 text-sm mt-2 mb-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!imageUrl || !isValidImage}
          >
            Insert Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImageMenu;