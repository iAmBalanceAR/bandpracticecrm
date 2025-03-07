import { gigHelpers } from '@/utils/db/gigs'
import createClient from '@/utils/supabase/client'
import jsPDF from 'jspdf'
import { format, isAfter, startOfDay } from 'date-fns'

interface ReportOptions {
  includeDirections: boolean;
  includeFinancials: boolean;
  includeContactInfo: boolean;
}

interface ReportData {
  tourInfo: {
    title: string;
    startDate: string;
    endDate: string;
    totalMileage: number;
  };
  gigs: {
    venue: string;
    date: string;
    address: string;
    loadIn: string;
    setTime: string;
    contactInfo?: {
      name: string;
      email: string;
      phone: string;
    };
    distanceFromPrevious?: number;
  }[];
  directions?: {
    fromVenue: string;
    toVenue: string;
    route: string[];
    distance: number;
    estimatedTime: string;
  }[];
  financials?: {
    totalDeposits: number;
    totalPayments: number;
    estimatedExpenses: number;
  };
}

export async function generateTourReport(tourId: string, options: ReportOptions) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('No authenticated user')
  }

  // Get tour information
  const { data: tour } = await supabase
    .from('tours')
    .select('*')
    .eq('id', tourId)
    .single()

  if (!tour) {
    throw new Error('Tour not found')
  }

  // Get gigs for the tour
  const allGigs = await gigHelpers.getGigs(tourId)
  
  // Filter gigs to only include future dates
  const today = startOfDay(new Date())
  const futureGigs = allGigs.filter(gig => {
    const gigDate = startOfDay(new Date(gig.gig_date))
    return isAfter(gigDate, today) || gigDate.getTime() === today.getTime()
  }).sort((a, b) => new Date(a.gig_date).getTime() - new Date(b.gig_date).getTime())

  if (futureGigs.length === 0) {
    throw new Error('No upcoming gigs found for this tour')
  }

  // Get coordinates and calculate route for future gigs only
  const { tourStops } = await gigHelpers.getGigsWithCoordinates(tourId)

  // Filter tourStops to match futureGigs
  const filteredTourStops = tourStops.filter(stop => 
    futureGigs.some(gig => gig.venue === stop.name && gig.gig_date === stop.gig_date)
  ).sort((a, b) => new Date(a.gig_date).getTime() - new Date(b.gig_date).getTime())

  // Calculate total mileage and get directions if needed
  let totalMileage = 0;
  let directions: {
    fromVenue: string;
    toVenue: string;
    route: string[];
    distance: number;
    estimatedTime: string;
  }[] = [];

  if (filteredTourStops.length > 1) {
    for (let i = 0; i < filteredTourStops.length - 1; i++) {
      const start = filteredTourStops[i]
      const end = filteredTourStops[i + 1]
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&steps=true&annotations=true`
      
      try {
        const response = await fetch(url)
        const data = await response.json()
        
        if (data.code === 'Ok') {
          const route = data.routes[0]
          const legDistance = Math.ceil(route.distance * 0.000621371) // Convert meters to miles and round up
          totalMileage += legDistance // Add the rounded leg distance to total
          
          // Extract turn-by-turn directions from the steps
          const directions_steps = route.legs[0].steps.map((step: any) => {
            let instruction = step.maneuver.type
            if (step.maneuver.modifier) {
              instruction += ` ${step.maneuver.modifier}`
            }
            if (step.name) {
              instruction += ` onto ${step.name}`
            }
            if (step.distance) {
              instruction += ` for ${Math.ceil(step.distance * 0.000621371)} miles`
            }
            return instruction.charAt(0).toUpperCase() + instruction.slice(1)
          }).filter((instruction: string) => instruction !== 'Turn');
          
          directions.push({
            fromVenue: start.name,
            toVenue: end.name,
            route: directions_steps,
            distance: legDistance,
            estimatedTime: formatDuration(route.duration)
          })
        }
      } catch (error) {
        console.error('Error fetching directions:', error)
      }
    }
  }

  // Transform gigs data using filtered future gigs
  const formattedGigs = futureGigs.map((gig, index) => {
    // Find the corresponding direction for this gig (if it exists)
    const previousLegDistance = index > 0 && directions.length >= index 
      ? directions[index - 1].distance 
      : undefined;

    return {
      venue: gig.venue,
      date: gig.gig_date,
      address: `${gig.venue_address} ${gig.venue_city}, ${gig.venue_state} ${gig.venue_zip}`,
      loadIn: gig.load_in_time,
      setTime: gig.set_time,
      contactInfo: options.includeContactInfo ? {
        name: gig.contact_name,
        email: gig.contact_email,
        phone: gig.contact_phone
      } : undefined,
      distanceFromPrevious: previousLegDistance
    };
  });

  // Calculate financials if needed (using only future gigs)
  let financials
  if (options.includeFinancials) {
    const totalDeposits = futureGigs.reduce((sum, gig) => sum + (gig.deposit_amount || 0), 0)
    const totalPayments = futureGigs.reduce((sum, gig) => sum + gig.contract_total, 0)
    // Calculate estimated expenses based on total mileage
    const estimatedExpenses = totalMileage * 0.65 // $0.65 per mile

    financials = {
      totalDeposits,
      totalPayments,
      estimatedExpenses
    }
  }

  return {
    tourInfo: {
      title: tour.title,
      startDate: formatDate(tour.departure_date),
      endDate: formatDate(tour.return_date),
      description: tour.description,
      totalMileage
    },
    gigs: formattedGigs.map(gig => ({
      ...gig,
      date: formatDate(gig.date)
    })),
    directions: options.includeDirections ? directions : undefined,
    financials: options.includeFinancials ? financials : undefined
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

export async function generatePDF(reportData: ReportData) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Set initial position
  let y = 20;
  const margin = 20;
  const pageWidth = (pdf.internal as any).pageSize.width;
  const contentWidth = pageWidth - (margin * 2);

  // Add custom fonts and icons
  pdf.addFont('fonts/lucide-icons.ttf', 'LucideIcons', 'normal');

  // Helper functions
  const splitText = (text: string, fontSize: number, width?: number): string[] => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, width || contentWidth);
  };

  const renderText = (
    text: any,
    x: number,
    y: number,
    options?: { 
      align?: 'left' | 'center' | 'right', 
      fontSize?: number, 
      isBold?: boolean,
      textColor?: string 
    }
  ) => {
    const safeText = String(text || '');
    if (options?.fontSize) pdf.setFontSize(options.fontSize);
    if (options?.isBold) {
      pdf.setFont('helvetica', 'bold');
    } else {
      pdf.setFont('helvetica', 'normal');
    }
    if (options?.textColor) {
      const color = options.textColor.match(/^#([A-Fa-f0-9]{6})$/);
      if (color) {
        const r = parseInt(color[1].substring(0, 2), 16) / 255;
        const g = parseInt(color[1].substring(2, 4), 16) / 255;
        const b = parseInt(color[1].substring(4, 6), 16) / 255;
        pdf.setTextColor(r, g, b);
      }
    } else {
      pdf.setTextColor(0, 0, 0);
    }
    (pdf as any).text(safeText, x, y, options);
  };

  const drawLine = (startX: number, startY: number, endX: number, endY: number, color: string = '#E5E7EB') => {
    const rgb = color.match(/^#([A-Fa-f0-9]{6})$/);
    if (rgb) {
      const r = parseInt(rgb[1].substring(0, 2), 16) / 255;
      const g = parseInt(rgb[1].substring(2, 4), 16) / 255;
      const b = parseInt(rgb[1].substring(4, 6), 16) / 255;
      pdf.setDrawColor(r, g, b);
    }
    pdf.setLineWidth(0.2);
    pdf.line(startX, startY, endX, endY);
  };

  const addNewPage = () => {
    pdf.addPage();
    y = 20;
  };

  const needsNewPage = (requiredSpace: number) => {
    const pageHeight = (pdf.internal as any).pageSize.height;
    return (y + requiredSpace) > (pageHeight - margin);
  };

  // Title Section
  renderText(reportData.tourInfo.title, pageWidth / 2, y + 5, { 
    align: 'center', 
    fontSize: 24, 
    isBold: true
  });

  y += 20;

  // Tour Info Grid
  const infoWidth = contentWidth / 2;
  renderText(`Start: ${reportData.tourInfo.startDate}`, margin, y, { 
    fontSize: 12,
    textColor: '#6B7280'
  });
  renderText(`End: ${reportData.tourInfo.endDate}`, margin + infoWidth, y, { 
    fontSize: 12,
    textColor: '#6B7280'
  });
  y += 8;
  renderText(`Total Distance: ${Math.ceil(reportData.tourInfo.totalMileage)} miles`, margin, y, { 
    fontSize: 12,
    textColor: '#6B7280'
  });
  y += 20;

  // Financial Summary Section
  if (reportData.financials) {
    renderText('Financial Summary', margin + 5, y + 5, { 
      fontSize: 16, 
      isBold: true
    });
    y += 20;

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    
    // Draw table header
    pdf.setFillColor(247, 248, 250); // Light gray background
    pdf.rect(margin, y, contentWidth, 10, 'F');
    
    renderText('Item', margin + 5, y + 6, { 
      fontSize: 10,
      isBold: true
    });
    renderText('Amount', pageWidth - margin - 5, y + 6, { 
      fontSize: 10,
      isBold: true,
      align: 'right'
    });
    y += 10;

    // Draw table rows
    const items = [
      { label: 'Total Contract Value', value: reportData.financials.totalPayments },
      { label: 'Total Deposits', value: reportData.financials.totalDeposits },
      { label: 'Remaining Balance', value: reportData.financials.totalPayments - reportData.financials.totalDeposits },
      { label: 'Estimated Expenses', value: reportData.financials.estimatedExpenses },
    ];

    items.forEach((item, index) => {
      if (index % 2 === 0) {
        pdf.setFillColor(252, 252, 253); // Extremely light gray for zebra striping
        pdf.rect(margin, y, contentWidth, 10, 'F');
      }
      
      renderText(item.label, margin + 5, y + 6, { 
        fontSize: 10,
        textColor: '#6B7280'
      });
      renderText(formatCurrency(item.value), pageWidth - margin - 5, y + 6, { 
        fontSize: 10,
        align: 'right'
      });
      y += 10;
    });

    // Draw total line
    drawLine(margin, y, margin + contentWidth, y);
    y += 5;
    renderText('Estimated Net', margin + 5, y + 6, { 
      fontSize: 12,
      isBold: true
    });
    renderText(
      formatCurrency(reportData.financials.totalPayments - reportData.financials.estimatedExpenses),
      pageWidth - margin - 5, 
      y + 6, 
      { 
        fontSize: 12,
        isBold: true,
        align: 'right'
      }
    );

    y += 20;
  }

  // Tour Schedule Section - Start on new page
  addNewPage();
  renderText('Tour Schedule', margin, y, { 
    fontSize: 16, 
    isBold: true
  });
  y += 15;

  for (const gig of reportData.gigs) {
    if (needsNewPage(60)) addNewPage();

    // Header with date and venue
    renderText(gig.venue, margin + 5, y + 5, { 
      fontSize: 14, 
      isBold: true
    });
    renderText(gig.date, pageWidth - margin - 5, y + 5, { 
      fontSize: 12,
      align: 'right',
      textColor: '#6B7280'
    });

    // Distance info
    if (gig.distanceFromPrevious) {
      renderText(`${Math.ceil(gig.distanceFromPrevious)} miles from previous venue`, pageWidth - margin - 5, y + 12, { 
        fontSize: 10,
        align: 'right',
        textColor: '#3B82F6'
      });
    }

    y += 15; // Reduced from 20

    // Two-column layout for details
    const colWidth = contentWidth / 2;
    
    // Left column
    renderText(`Load In: ${gig.loadIn}`, margin + 5, y, { 
      fontSize: 12,
      textColor: '#6B7280'
    });
    y += 6; // Reduced from 8
    renderText(`Set Time: ${gig.setTime}`, margin + 5, y, { 
      fontSize: 12,
      textColor: '#6B7280'
    });
    y += 6; // Reduced from 8
    
    // Use a narrower width for address text to force earlier wrapping
    const addressWidth = contentWidth * 0.35; // Reduced from full column width
    const addressLines = splitText(gig.address, 10, addressWidth);
    addressLines.forEach((line, index) => {
      renderText(line, margin + 5, y + (index * 4), {
        fontSize: 10,
        textColor: '#6B7280'
      });
    });

    // Right column - Contact Info
    if (gig.contactInfo) {
      const rightCol = margin + colWidth;
      let contactY = y - 12; // Adjusted from -16
      
      const contactName = gig.contactInfo.name || 'N/A';
      const contactPhone = gig.contactInfo.phone || 'N/A';
      const contactEmail = gig.contactInfo.email || 'N/A';

      renderText(contactName, rightCol, contactY, { 
        fontSize: 12,
        textColor: '#6B7280'
      });
      contactY += 6; // Reduced from 8
      renderText(contactPhone, rightCol, contactY, { 
        fontSize: 12,
        textColor: '#6B7280'
      });
      contactY += 6; // Reduced from 8
      renderText(contactEmail, rightCol, contactY, { 
        fontSize: 12,
        textColor: '#6B7280'
      });
    }

    // Add a subtle divider with less padding
    y += 25; // Reduced from 35
    drawLine(margin, y, margin + contentWidth, y);
    y += 15; // Reduced from 40
  }

  // Driving Directions Section
  if (reportData.directions && reportData.directions.length > 0) {
    addNewPage();
    renderText('Driving Directions', margin, y, { 
      fontSize: 16, 
      isBold: true
    });
    y += 15;

    for (const leg of reportData.directions) {
      if (needsNewPage(60)) addNewPage();

      renderText(`${leg.fromVenue || 'Unknown Location'} → ${leg.toVenue || 'Unknown Location'}`, margin + 5, y + 5, { 
        fontSize: 14,
        isBold: true
      });
      y += 15;

      renderText(`${leg.distance} miles - ${leg.estimatedTime}`, margin + 5, y, { 
        fontSize: 12,
        textColor: '#3B82F6'
      });
      y += 10;

      for (const step of leg.route) {
        if (needsNewPage(8)) addNewPage();
        const lines = splitText(`• ${step}`, 10);
        lines.forEach(line => {
          renderText(line, margin + 5, y, { 
            fontSize: 10,
            textColor: '#6B7280'
          });
          y += 6;
        });
      }

      // Add a subtle divider
      drawLine(margin, y + 15, margin + contentWidth, y + 15);
      y += 20;
    }
  }

  // Save the PDF
  pdf.save(`${reportData.tourInfo.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tour_report.pdf`);
}

function formatDate(dateString: string | null) {
  if (!dateString) return 'Not set';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return format(date, 'MMM d, yyyy');
  } catch (error) {
    return 'Invalid date';
  }
} 