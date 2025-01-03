import { gigHelpers } from '@/utils/db/gigs'
import createClient from '@/utils/supabase/client'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

interface ReportOptions {
  includeMap: boolean;
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
  mapImageUrl?: string;
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
  const gigs = await gigHelpers.getGigs(tourId)

  // Get coordinates and calculate route
  const { tourStops } = await gigHelpers.getGigsWithCoordinates(tourId)

  // Calculate total mileage and get directions if needed
  let totalMileage = 0
  let directions = []

  if (options.includeDirections && tourStops.length > 1) {
    for (let i = 0; i < tourStops.length - 1; i++) {
      const start = tourStops[i]
      const end = tourStops[i + 1]
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
            distance: legDistance, // Use the already rounded leg distance
            estimatedTime: formatDuration(route.duration)
          })
        }
      } catch (error) {
        console.error('Error fetching directions:', error)
      }
    }
  }

  // Transform gigs data
  const formattedGigs = gigs.map((gig, index) => ({
    venue: gig.venue,
    date: gig.gig_date,
    address: `${gig.venue_address}, ${gig.venue_city}, ${gig.venue_state} ${gig.venue_zip}`,
    loadIn: gig.load_in_time,
    setTime: gig.set_time,
    contactInfo: options.includeContactInfo ? {
      name: gig.contact_name,
      email: gig.contact_email,
      phone: gig.contact_phone
    } : undefined,
    distanceFromPrevious: index > 0 ? directions[index - 1]?.distance : undefined
  }))

  // Calculate financials if needed
  let financials
  if (options.includeFinancials) {
    const totalDeposits = gigs.reduce((sum, gig) => sum + (gig.deposit_amount || 0), 0)
    const totalPayments = gigs.reduce((sum, gig) => sum + gig.contract_total, 0)
    // Estimated expenses could be calculated based on mileage and other factors
    const estimatedExpenses = totalMileage * 0.65 // Example: $0.65 per mile

    financials = {
      totalDeposits,
      totalPayments,
      estimatedExpenses
    }
  }

  return {
    tourInfo: {
      title: tour.title,
      startDate: tour.start_date,
      endDate: tour.end_date,
      totalMileage
    },
    gigs: formattedGigs,
    directions: options.includeDirections ? directions : undefined,
    mapImageUrl: options.includeMap ? await captureMap() : undefined,
    financials: options.includeFinancials ? financials : undefined
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${hours}h ${minutes}m`
}

async function captureMap(): Promise<string> {
  // This function will need to be implemented to capture the map as an image
  // It might involve using html2canvas on a map element
  // For now, return a placeholder
  return ''
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

  // Helper function for text wrapping
  const splitText = (text: string, fontSize: number): string[] => {
    pdf.setFontSize(fontSize);
    return pdf.splitTextToSize(text, contentWidth);
  };

  // Safe text rendering helper
  const renderText = (
    text: any,
    x: number,
    y: number,
    options?: { align?: 'left' | 'center' | 'right' }
  ) => {
    const safeText = String(text || '');
    (pdf as any).text(safeText, x, y, options);
  };

  // Add title
  pdf.setFontSize(24);
  pdf.setTextColor(0, 0, 0);
  renderText(reportData.tourInfo.title, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Add tour information
  pdf.setFontSize(12);
  renderText(`Start Date: ${reportData.tourInfo.startDate || ''}`, margin, y);
  renderText(`End Date: ${reportData.tourInfo.endDate || ''}`, pageWidth - margin, y, { align: 'right' });
  y += 10;
  renderText(`Total Mileage: ${Math.ceil(reportData.tourInfo.totalMileage)} miles`, margin, y);
  y += 15;

  // Add map if included (now at the top, right after basic info)
  if (reportData.mapImageUrl && reportData.mapImageUrl.length > 0) {
    try {
      const img = new Image();
      img.src = reportData.mapImageUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Calculate dimensions to maintain aspect ratio while fitting the page width
      const imgAspectRatio = img.height / img.width;
      const imgWidth = contentWidth;
      // Limit the height to a reasonable size on the page
      const maxHeight = 100; // millimeters
      const calculatedHeight = imgWidth * imgAspectRatio;
      const imgHeight = Math.min(calculatedHeight, maxHeight);

      // Add some padding before the map
      y += 5;
      
      // Add map title
      pdf.setFontSize(16);
      renderText('Tour Route Map', margin, y);
      y += 10;

      // Add the map with compression
      pdf.addImage(
        reportData.mapImageUrl,
        'PNG',
        margin,
        y,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );
      
      y += imgHeight + 15; // Add some padding after the map
    } catch (error) {
      console.error('Error adding map to PDF:', error);
    }
  }

  // Add gig list
  pdf.setFontSize(16);
  renderText('Tour Schedule', margin, y);
  y += 10;

  // Gigs
  pdf.setFontSize(10);
  for (const gig of reportData.gigs) {
    if (y > (pdf.internal as any).pageSize.height - 30) {
      pdf.addPage();
      y = 20;
    }

    pdf.setFont('helvetica', 'bold');
    renderText(gig.venue, margin, y);
    pdf.setFont('helvetica', 'normal');
    y += 5;
    renderText(`Date: ${gig.date}`, margin + 5, y);
    y += 5;
    renderText(`Load In: ${gig.loadIn} | Set Time: ${gig.setTime}`, margin + 5, y);
    y += 5;
    const addressLines = splitText(`Address: ${gig.address}`, 10);
    addressLines.forEach((line: string) => {
      renderText(line, margin + 5, y);
      y += 5;
    });
    if (gig.distanceFromPrevious) {
      renderText(`Distance from previous: ${Math.ceil(gig.distanceFromPrevious)} miles`, margin + 5, y);
      y += 5;
    }
    y += 5;
  }

  // Add directions if included
  if (reportData.directions && reportData.directions.length > 0) {
    pdf.addPage();
    const startY = 20;
    y = startY;
    pdf.setFontSize(16);
    renderText('Driving Directions', margin, y);
    y += 10;

    pdf.setFontSize(10);
    for (const leg of reportData.directions) {
      if (y > (pdf.internal as any).pageSize.height - 30) {
        pdf.addPage();
        y = startY;
      }

      pdf.setFont('helvetica', 'bold');
      const fromVenue = leg.fromVenue || '';
      const toVenue = leg.toVenue || '';
      renderText(`${fromVenue} → ${toVenue}`, margin, y);
      pdf.setFont('helvetica', 'normal');
      y += 5;
      renderText(`Distance: ${Math.ceil(leg.distance)} miles | Est. Time: ${leg.estimatedTime}`, margin + 5, y);
      y += 5;

      leg.route.forEach((step: string, index: number) => {
        if (y > (pdf.internal as any).pageSize.height - 30) {
          pdf.addPage();
          y = startY;
        }
        const stepLines = splitText(`${index + 1}. ${step}`, 10);
        stepLines.forEach((line: string) => {
          renderText(line, margin + 5, y);
          y += 5;
        });
      });
      y += 5;
    }
  }

  // Add financials if included
  if (reportData.financials) {
    const startY = y;
    if (startY > (pdf.internal as any).pageSize.height - 60) {
      pdf.addPage();
      y = 20;
    } else {
      y += 10;
    }

    pdf.setFontSize(16);
    renderText('Financial Summary', margin, y);
    y += 10;

    pdf.setFontSize(10);
    const { totalDeposits = 0, totalPayments = 0, estimatedExpenses = 0 } = reportData.financials;
    renderText(`Total Deposits: $${totalDeposits.toFixed(2)}`, margin + 5, y);
    y += 5;
    renderText(`Total Payments: $${totalPayments.toFixed(2)}`, margin + 5, y);
    y += 5;
    renderText(`Estimated Expenses: $${estimatedExpenses.toFixed(2)}`, margin + 5, y);
    y += 5;
    const netIncome = totalPayments - estimatedExpenses;
    renderText(`Net Income: $${netIncome.toFixed(2)}`, margin + 5, y);
  }

  // Save the PDF
  const fileName = reportData.tourInfo.title.replace(/\s+/g, '_');
  pdf.save(`${fileName}_Tour_Report.pdf`);
} 