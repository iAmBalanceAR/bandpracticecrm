"use client"

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { RiderFormProps, RiderSection, RiderSectionContent, InputListRow, TechnicalRiderDetails } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2, Copy } from 'lucide-react'
import { Switch } from "@/components/ui/switch"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from '@/components/ui/checkbox'
import { createRider, updateRider } from '../actions'
import { useRouter } from 'next/navigation'
import { FeedbackModal } from "@/components/ui/feedback-modal"
import { SectionSelect } from './section-select'
import { RiderSection as RiderSectionComponent } from './rider-section'
import { Label } from "@/components/ui/label"
import { InputList } from './input-list'
import { v4 as uuidv4 } from 'uuid'

interface Template {
  id: string
  title: string
  type: string
}

interface Section {
  id: string
  name: string
  sort_order: number
  is_custom: boolean
  is_default: boolean
  content: Record<string, any>
}

interface Rider {
  id: string
  title: string
  type: string
  is_template: boolean
  stage_plot_id?: string
  sections?: Section[]
}

// Base schema for the form
const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  type: z.string(),
  is_template: z.boolean().default(false),
  template_id: z.string().optional(),
  stage_plot_id: z.string().optional(),
  setlist_id: z.string().optional(),
  gig_id: z.string().optional(),
})

export function RiderForm({
  type,
  initialData,
  isLoading = false,
  stagePlots = [],
  setlists = [],
}: RiderFormProps) {
  console.log('RiderForm initialData:', initialData) // Debug log for all initial data
  console.log('RiderForm initialData.details:', initialData?.details) // Debug log for details specifically

  const [isSaving, setIsSaving] = useState(false)
  const [sections, setSections] = useState<Section[]>(initialData?.sections || [])
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [sectionContents, setSectionContents] = useState<Map<string, any>>(new Map(
    initialData?.sections?.map((section: Section) => [section.id, section.content]) || []
  ))
  const [customSections, setCustomSections] = useState<Map<string, string>>(new Map(
    initialData?.sections?.filter((s: Section) => s.is_custom).map((s: Section) => [s.id, s.name]) || []
  ))
  const [inputListRows, setInputListRows] = useState<InputListRow[]>(() => {
    console.log('Initializing inputListRows with type:', type)
    console.log('Initializing inputListRows with details:', initialData?.details)
    
    if (type === 'technical' && initialData?.details) {
      const inputList = (initialData.details as TechnicalRiderDetails).input_list || []
      console.log('Found input list in details:', inputList)
      return inputList
    }
    
    // Default to one empty row
    console.log('No input list found, creating empty row')
    return [{
      id: uuidv4(),
      rider_id: initialData?.id || '',
      channel_number: 1,
      instrument: '',
      microphone: ''
    }]
  })
  const [availableGigs, setAvailableGigs] = useState<Array<{ id: string; title: string; gig_date: string }>>([])
  const [availableTemplates, setAvailableTemplates] = useState<Template[]>([])
  const router = useRouter()
  const [feedbackModal, setFeedbackModal] = useState<{ isOpen: boolean; title: string; message: string; type: 'success' | 'error' | 'delete' | 'warning'; onConfirm?: () => void; confirmLabel?: string; confirmStyle?: 'success' | 'danger'; }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  })
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false)
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')

  // Fetch available sections on mount
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await fetch(`/api/riders/sections?type=${type}`)
        const data = await response.json()
        setSections(data)
      } catch (error) {
        console.error('Error fetching sections:', error)
        setFeedbackModal({ isOpen: true, title: 'Warning', message: 'Failed to load section options', type: 'warning' });
      }
    }

    fetchSections()
  }, [type])

  // Fetch available templates
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoadingTemplates(true)
        const response = await fetch(`/api/riders/templates?type=${type}`)
        if (!response.ok) throw new Error('Failed to fetch templates')
        const templates = await response.json()
        setAvailableTemplates(templates)
      } catch (error) {
        console.error('Error fetching templates:', error)
        setFeedbackModal({
          isOpen: true,
          title: 'Error',
          message: 'Failed to load templates',
          type: 'error'
        })
      } finally {
        setIsLoadingTemplates(false)
      }
    }

    fetchTemplates()
  }, [type])

  // Fetch available gigs on mount
  useEffect(() => {
    const fetchGigs = async () => {
      try {
        const response = await fetch('/api/gigs/upcoming')
        const data = await response.json()
        setAvailableGigs(data)
      } catch (error) {
        console.error('Error fetching gigs:', error)
        setFeedbackModal({ isOpen: true, title: 'Warning', message: 'Failed to load available gigs', type: 'warning' });
      }
    }

    fetchGigs()
  }, [])

  // Initialize section content from initialData
  useEffect(() => {
    if (initialData?.sections) {
      const newSelectedSections = new Set<string>()
      const newSectionContents = new Map<string, any>()
      const newCustomSections = new Map<string, string>()

      initialData.sections.forEach(section => {
        const sectionId = section.id
        newSelectedSections.add(sectionId)
        
        // Handle content structure
        let sectionContent = section.content
        if (typeof sectionContent === 'string') {
          sectionContent = sectionContent
        } else if (sectionContent?.text) {
          sectionContent = sectionContent.text
        } else if (sectionContent?.content) {
          sectionContent = sectionContent.content
        }
        
        console.log('Setting content for section:', sectionId, sectionContent)
        newSectionContents.set(sectionId, sectionContent)
        
        if (section.is_custom) {
          newCustomSections.set(sectionId, section.name)
        }
      })

      setSelectedSections(newSelectedSections)
      setSectionContents(newSectionContents)
      setCustomSections(newCustomSections)
      
      console.log('Initialized sections:', {
        selectedSections: Array.from(newSelectedSections),
        sectionContents: Object.fromEntries(newSectionContents),
        customSections: Object.fromEntries(newCustomSections)
      })
    }
  }, [initialData])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || '',
      type,
      is_template: initialData?.is_template || false,
      stage_plot_id: initialData?.stage_plot_id || undefined,
      setlist_id: initialData?.setlist_id || undefined,
      gig_id: initialData?.gig_id || undefined,
    }
  })

  const handleSectionToggle = (sectionId: string) => {
    const newSelectedSections = new Set(selectedSections)
    if (newSelectedSections.has(sectionId)) {
      newSelectedSections.delete(sectionId)
      const newSectionContents = new Map(sectionContents)
      newSectionContents.delete(sectionId)
      setSectionContents(newSectionContents)
    } else {
      newSelectedSections.add(sectionId)
    }
    setSelectedSections(newSelectedSections)
  }

  const handleCustomSectionAdd = (name: string) => {
    try {
      if (!name) {
        console.error('Custom section name is required')
        setFeedbackModal({ 
          isOpen: true, 
          title: 'Error', 
          message: 'Section name is required', 
          type: 'error' 
        })
        return
      }
      
      const id = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      console.log('Creating custom section:', { id, name })
      
      const newCustomSections = new Map(customSections)
      newCustomSections.set(id, name)
      setCustomSections(newCustomSections)
      
      const newSelectedSections = new Set(selectedSections)
      newSelectedSections.add(id)
      setSelectedSections(newSelectedSections)
      
      const newSectionContents = new Map(sectionContents)
      newSectionContents.set(id, '')
      setSectionContents(newSectionContents)
      
      console.log('Custom section added successfully:', { 
        id, 
        name, 
        totalSections: newSelectedSections.size 
      })
    } catch (error) {
      console.error('Error adding custom section:', error)
      setFeedbackModal({ 
        isOpen: true, 
        title: 'Error', 
        message: 'Failed to add custom section', 
        type: 'error' 
      })
    }
  }

  const handleSectionContentChange = (sectionId: string, content: any) => {
    if (!sectionId) return
    
    console.log('Updating content for section:', sectionId, content)
    const newSectionContents = new Map(sectionContents)
    
    // Ensure content is stored in a consistent format
    let updatedContent = content
    if (typeof content === 'object' && content !== null) {
      if (content.text) {
        updatedContent = content.text
      } else if (content.content) {
        updatedContent = content.content
      }
    }
    
    newSectionContents.set(sectionId, updatedContent)
    setSectionContents(newSectionContents)
    
    console.log('Updated section contents:', Object.fromEntries(newSectionContents))
  }

  const handleTemplateSelect = async (templateId: string) => {
    try {
      setIsLoadingTemplate(true)
      const response = await fetch(`/api/riders/${templateId}`)
      const template = await response.json()
      console.log('Loaded template data:', template)
      
      // Update form values
      form.setValue('title', `Copy of ${template.title}`)
      
      // Fetch input list if this is a technical rider
      if (type === 'technical') {
        const inputListResponse = await fetch(`/api/riders/${templateId}/input-list`)
        const inputListData = await inputListResponse.json()
        console.log('Template input list data:', inputListData)
        
        if (inputListData && Array.isArray(inputListData)) {
          // Map the input list data to new rows with new IDs
          const newInputListRows = inputListData.map(row => ({
            ...row,
            id: uuidv4(), // Generate new IDs for the copied rows
            rider_id: '' // This will be set when the new rider is created
          }))
          setInputListRows(newInputListRows)
        }
      }
      
      // Update sections and contents
      if (template.sections) {
        const templateSections = template.sections as Section[]
        console.log('Template sections:', templateSections)
        
        // Update selected sections and their contents
        const newSelectedSections = new Set<string>()
        const newContents = new Map()
        const newCustomSections = new Map()
        
        templateSections.forEach((section) => {
          const sectionId = section.id
          newSelectedSections.add(sectionId)
          
          // Handle content structure
          let sectionContent = section.content
          if (typeof sectionContent === 'string') {
            sectionContent = sectionContent
          } else if (sectionContent?.text) {
            sectionContent = sectionContent.text
          } else if (sectionContent?.content) {
            sectionContent = sectionContent.content
          }
          
          console.log('Setting template content for section:', sectionId, sectionContent)
          newContents.set(sectionId, sectionContent)
          
          if (section.is_custom) {
            newCustomSections.set(sectionId, section.name)
          }

          // Add section to available sections if not already present
          if (!sections.some(s => s.id === section.id)) {
            setSections(prev => [...prev, {
              id: section.id,
              name: section.name,
              sort_order: section.sort_order,
              is_custom: section.is_custom,
              is_default: section.is_default,
              content: sectionContent
            }])
          }
        })
        
        setSelectedSections(newSelectedSections)
        setSectionContents(newContents)
        setCustomSections(newCustomSections)
        
        console.log('Updated template sections:', {
          selectedSections: Array.from(newSelectedSections),
          sectionContents: Object.fromEntries(newContents),
          customSections: Object.fromEntries(newCustomSections)
        })
      }
    } catch (error) {
      console.error('Error loading template:', error)
      setFeedbackModal({ 
        isOpen: true, 
        title: 'Error', 
        message: 'Failed to load template', 
        type: 'error' 
      })
    } finally {
      setIsLoadingTemplate(false)
    }
  }

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      setIsSaving(true)

      // Prepare section contents for submission
      const sectionData = Array.from(selectedSections).map((sectionId, index) => {
        const isCustom = sectionId === '00000000-0000-0000-0000-000000000000' || 
                        sections.find(s => s.id === sectionId)?.is_custom ||
                        sectionId.startsWith('custom-')
        const content = sectionContents.get(sectionId)
        const customName = customSections.get(sectionId) ?? null
        
        return {
          section_id: isCustom ? '00000000-0000-0000-0000-000000000000' : sectionId,
          custom_section_name: isCustom ? customName : null,
          content: content || {},
          sort_order: index
        }
      })

      if (initialData?.id) {
        const result = await updateRider({
          riderId: initialData.id,
          type,
          title: data.title,
          is_template: data.is_template,
          stage_plot_id: data.stage_plot_id,
          setlist_id: data.setlist_id,
          gig_id: data.gig_id,
          sections: sectionData,
          input_list: type === 'technical' ? inputListRows : undefined
        })

        if (!result.success) throw new Error('Failed to update rider')
      } else {
        const result = await createRider({
          type,
          title: data.title,
          is_template: data.is_template,
          stage_plot_id: data.stage_plot_id,
          setlist_id: data.setlist_id,
          gig_id: data.gig_id,
          sections: sectionData,
          input_list: type === 'technical' ? inputListRows : undefined
        })

        if (!result.success) throw new Error('Failed to create rider')
      }

      setFeedbackModal({ isOpen: true, title: initialData ? 'Rider updated' : 'Rider created', message: '', type: 'success' });
      router.push('/riders')
      router.refresh()
    } catch (error) {
      console.error('Error saving rider:', error)
      setFeedbackModal({ isOpen: true, title: 'Error', message: 'Something went wrong', type: 'error' });
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    if (selectedTemplate && !initialData) {
      const loadTemplate = async () => {
        try {
          const response = await fetch(`/api/riders/${selectedTemplate}`)
          if (!response.ok) throw new Error('Failed to fetch template')
          const template = await response.json()
          console.log('Loaded template data:', template)
          
          // Update form values
          form.setValue('title', `Copy of ${template.title}`)
          
          // Update sections and contents
          if (template.sections) {
            const templateSections = template.sections as Section[]
            console.log('Template sections to load:', templateSections)
            
            // Update selected sections and their contents
            const newSelectedSections = new Set<string>()
            const newContents = new Map()
            const newCustomSections = new Map()
            
            templateSections.forEach((section) => {
              const sectionId = section.id
              newSelectedSections.add(sectionId)
              // Handle content structure
              const content = typeof section.content === 'string' 
                ? section.content 
                : section.content.text || section.content
              newContents.set(sectionId, content)
              console.log('Setting content for section:', sectionId, content)
              
              if (section.is_custom) {
                newCustomSections.set(sectionId, section.name)
              }
            })
            
            // Update all state at once
            setSections(templateSections)
            setSelectedSections(newSelectedSections)
            setSectionContents(newContents)
            setCustomSections(newCustomSections)
            
            console.log('Updated state:', {
              sections: templateSections,
              selectedSections: Array.from(newSelectedSections),
              sectionContents: Object.fromEntries(newContents),
              customSections: Object.fromEntries(newCustomSections)
            })
          }
        } catch (error) {
          console.error('Error loading template:', error)
          setFeedbackModal({
            isOpen: true,
            title: 'Error',
            message: 'Failed to load template',
            type: 'error'
          })
        }
      }

      loadTemplate()
    }
  }, [selectedTemplate, form, initialData])

  // Add debugging for initial section data
  useEffect(() => {
    console.log('Initial data sections:', initialData?.sections)
    console.log('Current sections state:', sections)
    console.log('Selected sections:', Array.from(selectedSections))
    console.log('Section contents:', Object.fromEntries(sectionContents))
  }, [initialData, sections, selectedSections, sectionContents])

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="border-blue-500/60 border rounded-lg px-4 pt-2 pb-4 bg-[#111C44]"> 
          <div className="flex items-center justify-between">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="flex-1 mr-4 mt-0 pt-0">
                  <FormLabel>
                    <h3 className="text-2xl mb-0 pt-0 mt-0">
                      <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                        Rider Title
                      </span>
                      <div className="border-[#ff9920] border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
                    </h3>
                  </FormLabel>
                  <FormControl>
                    <Input required className="text-gray-400 focus:text-gray-500 focus:border-white border-white" placeholder="Enter rider title..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <div className="flex flex-row mt-6">
            <FormField
              control={form.control}
              name="is_template"
              render={({ field }) => (
                  <FormItem className=" align-middle space-x-3 rounded-lg border border-blue-600/90 p-2 mt-2 relative w-52">
                  <FormLabel className="text-white top-[14px] left-[14px] absolute nowrap">Save as Template</FormLabel>
                  <FormControl>
                    <span className="float-right">
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    </span>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
          {!initialData && availableTemplates.length > 0 && (
            <FormField
              control={form.control}
              name="template_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <h3 className="text-xl mb-0 mt-6">
                      <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                        Start from Template
                      </span>
                      <div className="border-[#ff9920] border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
                    </h3>
                  </FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleTemplateSelect(value)
                    }}
                    defaultValue={field.value}
                    disabled={isLoadingTemplates}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue className="text-gray-400 focus:text-gray-500 focus:border-white border-white" placeholder={isLoadingTemplates ? "Loading templates..." : "Select a template..."} />
                        {isLoadingTemplates && (
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#111C44] text-white">
                      {availableTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center">
                            <Copy className="mr-2 h-4 w-4" />
                            {template.title}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-gray-400">
                    Start with a pre-configured template to save time
                  </FormDescription>
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="border-blue-500/60 border rounded-lg p-4 bg-[#111C44]"> 
          <FormField
            control={form.control}
            name="gig_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  <h3 className="text-xl mb-0">
                    <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                      Import A Gig
                    </span>
                    <div className="border-blue-500 border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
                  </h3>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-gray-400 focus:text-gray-500 focus:border-white border-white" placeholder="Select a gig..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#111C44] text-white">
                    {availableGigs.length === 0 && (
                      <SelectItem value="none" disabled>No upcoming gigs found</SelectItem>
                    )}
                    {availableGigs.map((gig) => (
                      <SelectItem key={gig.id} value={gig.id}>
                        {gig.title} - {new Date(gig.gig_date).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {type === 'technical' && (
          <FormField
            control={form.control}
            name="stage_plot_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>                
                  <h3 className="text-xl mb-0 mt-6 ">
                    <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                      Import Stage Plot
                    </span>
                    <div className="border-blue-500 border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
                  </h3>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-gray-400 focus:text-white focus:border-white border-white" placeholder="Select a stage plot..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#111C44] text-white">
                    {stagePlots.length === 0 && (
                      <SelectItem value="none" disabled>No stage plots found</SelectItem>
                    )}
                    {stagePlots.map((plot) => (
                      <SelectItem key={plot.id} value={plot.id}>
                        {plot.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          )}

          {type === 'technical' && (
          <FormField
            control={form.control}
            name="setlist_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                <h3 className="text-xl mb-0 mt-6">
                  <span className="mx-0 text-white text-shadow-sm font-mono -text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                    Import Setlist
                  </span>
                  <div className="border-blue-500 border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
                </h3>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue className="text-gray-400 focus:text-white focus:border-white border-white" placeholder="Select a setlist..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#111C44] text-white">
                    {setlists.length === 0 && (
                      <SelectItem value="none" disabled>No setlists found</SelectItem>
                    )}
                    {setlists.map((setlist) => (
                      <SelectItem key={setlist.id} value={setlist.id}>
                        {setlist.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          )}
        </div>

        {type === 'technical' && (
          <div className="border-blue-500/60 border rounded-lg p-4 bg-[#111C44]">
            <h3 className="text-xl mb-4">
              <span className="mx-0 text-white text-shadow-sm font-mono text-shadow-x-2 text-shadow-y-2 text-shadow-gray-800">
                Input List
              </span>
              <div className="border-[#ff9920] border-b-2 -mt-2 mb-0 h-2 ml-0 mr-0"></div>
            </h3>
            <InputList
              riderId={initialData?.id}
              initialRows={inputListRows}
              onRowsChange={setInputListRows}
            />
          </div>
        )}

        <div className="border-blue-500/60 border rounded-lg p-4 bg-[#0F1729] mb-6"> 
          <div className="space-y-4">
            <SectionSelect
              type={type}
              selectedSections={selectedSections}
              onSectionToggle={handleSectionToggle}
              onCustomSectionAdd={handleCustomSectionAdd}
              availableSections={sections}
            />
          </div>
        </div>
          <AnimatePresence mode="popLayout">
              {Array.from(selectedSections).map((sectionId) => {
                const section = sections.find(s => s.id === sectionId) || {
                  id: sectionId,
                  name: customSections.get(sectionId) || '',
                  custom: true as const
                }

                return (
                  <div className="border-blue-500/60 border rounded-lg p-0 bg-[#0F1729] mb-6"> 
                    <RiderSectionComponent
                      key={sectionId}
                      section={section}
                      content={sectionContents.get(sectionId) || ''}
                      onContentChange={(content) => handleSectionContentChange(sectionId, content)}
                      onRemove={() => handleSectionToggle(sectionId)}
                    /> 
                  </div>
                )
              })}
            </AnimatePresence>

          {/* Loading overlay */}
          <AnimatePresence>
            {isLoadingTemplate && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center"
              >
                <div className="bg-[#111C44] rounded-lg p-6 flex flex-col items-center space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <p className="text-white text-lg">Loading template sections...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex space-x-4">
            <Button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 border-black border-2"
              disabled={isLoading || isSaving}
            >
              {isLoading || isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Rider'
              )}
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="border-black border-2 bg-red-600 hover:bg-red-700 text-white flex-1"
              onClick={() => router.push('/riders')}
              disabled={isLoading || isSaving}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
        onConfirm={() => {
          if (feedbackModal.onConfirm) {
            feedbackModal.onConfirm();
          }
          setFeedbackModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </>
  )
} 