# Band Practice Application

## Design System and Layout Guidelines

### Color Palette

```typescript
colors: {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  dark: {
    background: '#111C44',
    card: '#1B254B',
    text: '#FFFFFF',
    muted: '#A0AEC0',
  },
  light: {
    background: '#F7FAFC',
    card: '#FFFFFF',
    text: '#2D3748',
    muted: '#718096',
  },
  accent: {
    success: '#48BB78',
    error: '#F56565',
    warning: '#ECC94B',
    info: '#4299E1',
  }
}
```

### Typography

```typescript
typography: {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    heading: ['Poppins', 'sans-serif'],
  },
  sizes: {
    h1: 'text-4xl font-bold',
    h2: 'text-3xl font-semibold',
    h3: 'text-2xl font-medium',
    body: 'text-base',
    small: 'text-sm',
    tiny: 'text-xs',
  }
}
```

### Layout Components

#### PageContainer

The main layout wrapper for all pages:

```typescript

<div className="min-h-screen bg-dark-background text-dark-text p-4 md:p-6 lg:p-8">
  {children}
</div>
```

#### Card

Reusable card component with consistent styling:

```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'small' | 'normal' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  padding = 'normal'
}) => {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    normal: 'p-4 md:p-6',
    large: 'p-6 md:p-8'
  };

  return (
    <div className={cn(
      'bg-dark-card rounded-lg shadow-lg',
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};
```

### Spacing System

Consistent spacing using Tailwind's scale:

- Extra small: `space-2` (0.5rem, 8px)
- Small: `space-4` (1rem, 16px)
- Medium: `space-6` (1.5rem, 24px)
- Large: `space-8` (2rem, 32px)
- Extra large: `space-12` (3rem, 48px)

### Responsive Breakpoints

```typescript
screens: {
  'sm': '640px',
  'md': '768px',
  'lg': '1024px',
  'xl': '1280px',
  '2xl': '1536px',
}
```

### Common Components

#### Button

Standard button component with variants:

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
}

const buttonVariants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white',
  secondary: 'bg-dark-card hover:bg-dark-card/80 text-white',
  outline: 'border border-primary-600 text-primary-600 hover:bg-primary-600/10',
  ghost: 'text-primary-600 hover:bg-primary-600/10'
};

const buttonSizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2',
  lg: 'px-6 py-3 text-lg'
};
```

#### Input

Standardized form input component:

```typescript
interface InputProps {
  error?: string;
  label?: string;
  helper?: string;
}

const inputStyles = {
  base: 'w-full rounded-md bg-dark-card border border-dark-muted/30 text-dark-text',
  focus: 'focus:ring-2 focus:ring-primary-600 focus:border-transparent',
  error: 'border-accent-error focus:ring-accent-error',
  disabled: 'opacity-50 cursor-not-allowed'
};
```

### Grid System

Flexible grid system using Tailwind's grid classes:

```typescript
// Basic grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar layout
<div className="grid grid-cols-12 gap-4">
  <aside className="col-span-12 lg:col-span-3">
    {/* Sidebar content */}
  </aside>
  <main className="col-span-12 lg:col-span-9">
    {/* Main content */}
  </main>
</div>
```

### Animation Classes

Common animation utilities:

```typescript
animations: {
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
}
```

### Best Practices

1. **Responsive Design**
   - Always start with mobile-first approach
   - Use responsive classes systematically
   - Test all breakpoints thoroughly

2. **Dark Mode Support**
   - Use `dark:` variant for dark mode styles
   - Ensure sufficient contrast in both modes
   - Test color combinations for accessibility

3. **Component Structure**
   - Keep components small and focused
   - Use composition over inheritance
   - Implement proper prop typing
   - Include proper accessibility attributes

4. **Performance**
   - Lazy load images and heavy components
   - Use proper caching strategies
   - Implement proper code splitting

## Dialog Boxes and Feedback Modals

The application uses a consistent system of dialog boxes for user feedback and confirmations. Here's how to use them:

### FeedbackModal Component

The `FeedbackModal` component is used for displaying success messages, errors, and confirmation dialogs. It supports three types of modals:

1. **Success Modal**

```typescript
setFeedbackModal({
  isOpen: true,
  title: "Success",
  message: "Operation completed successfully",
  type: 'success'
});
```

. **Error Modal**

```typescript
setFeedbackModal({
  isOpen: true,
  title: "Error",
  message: "An error occurred while processing your request",
  type: 'error'
});
```

. **Delete Confirmation Modal**

```typescript
showDeleteConfirmation(itemId, {
  title: 'Delete Item',
  message: 'Are you sure you want to delete this item?',
  onConfirm: async () => {
    // Handle deletion logic here
  }
});
```

1. **Success Messages**
   - Use for confirming successful operations
   - Keep messages clear and concise
   - Include what was accomplished (e.g., "Tour created successfully")

2. **Error Messages**
   - Always provide helpful error messages
   - Include what went wrong and possible solutions
   - Log detailed errors to console for debugging

3. **Delete Confirmations**
   - Always require confirmation for destructive actions
   - Clearly state what will be deleted
   - Mention if the action cannot be undone

### Implementation Example

```typescript
// State for feedback modal
const [feedbackModal, setFeedbackModal] = useState<{
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error';
}>({
  isOpen: false,
  title: '',
  message: '',
  type: 'success'
});

// Using the delete confirmation hook
const { deleteConfirmation, showDeleteConfirmation } = useDeleteConfirmation();

// Render the modals
<FeedbackModal
  isOpen={feedbackModal.isOpen}
  onClose={() => setFeedbackModal(prev => ({ ...prev, isOpen: false }))}
  title={feedbackModal.title}
  message={feedbackModal.message}
  type={feedbackModal.type}
/>

<FeedbackModal
  isOpen={deleteConfirmation.isOpen}
  onClose={deleteConfirmation.onClose}
  title={deleteConfirmation.title}
  message={deleteConfirmation.message}
  type="delete"
  onConfirm={deleteConfirmation.onConfirm}
/>
```

### Styling Guidelines

The modals follow the application's dark theme with consistent styling:

- Background: `bg-[#111C44]`
- Text: White for high contrast
- Success actions: Green accents
- Error/Delete actions: Red accents
- Confirmation buttons: Contrasting colors for clear action distinction

### Accessibility

The modals are built with accessibility in mind:

- Keyboard navigation support
- ARIA labels for screen readers
- Focus management
- Escape key closes modals
- Click outside modal area to close

Remember to always provide clear feedback to users through these modals and maintain consistency in their usage throughout the application.
