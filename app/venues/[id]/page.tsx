'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Heart, MapPin, Users, Globe, Phone, Mail, 
  Facebook, Twitter, Instagram, Youtube, Building, 
  Music, Calendar, Clock, Star, User, ArrowLeft , Tag
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import dynamic from 'next/dynamic';
import CustomSectionHeader from '@/components/common/CustomSectionHeader';

const Map = dynamic(() => import('@/components/ui/map'), {
  loading: () => <div className="h-[400px] bg-muted animate-pulse rounded-lg" />,
  ssr: false
});

interface VenueDetailProps {
  params: {
    id: string;
  };
}

export default function VenueDetail({ params }: VenueDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [venue, setVenue] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Helper function to clean URLs for display
  const cleanUrl = (url: string) => {
    if (!url) return '';
    const wwwIndex = url.indexOf('www.');
    if (wwwIndex !== -1) {
      return url.substring(wwwIndex);
    }
    const protocolIndex = url.indexOf('://');
    if (protocolIndex !== -1) {
      return url.substring(protocolIndex + 3);
    }
    return url;
  };

  useEffect(() => {
    fetchVenue();
    checkIfSaved();
  }, [params.id]);

  const fetchVenue = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('id', params.id)
        .single();

      if (error) throw error;
      setVenue(data);
    } catch (error) {
      console.error('Error fetching venue:', error);
      toast({
        title: 'Error',
        description: 'Failed to load venue details',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    try {
      const response = await fetch('/api/venues/saved');
      if (!response.ok) throw new Error('Failed to fetch saved venues');
      const { data } = await response.json();
      if (Array.isArray(data)) {
        setIsSaved(data.some(sv => sv.venue_id === params.id));
      }
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveToggle = async () => {
    try {
      const method = isSaved ? 'DELETE' : 'POST';
      const response = await fetch('/api/venues/saved', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venue_id: params.id })
      });

      if (!response.ok) throw new Error('Failed to update saved status');
      
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? 'Removed from saved venues' : 'Added to saved venues',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error updating saved status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update saved status',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    // Check if we have a source param indicating where the user came from
    const source = searchParams.get('source');
    const currentParams = new URLSearchParams(searchParams.toString());
    
    if (source === 'saved') {
      // When coming from saved venues, ensure we return to the saved tab
      currentParams.delete('source');  // Remove source param
      currentParams.set('tab', 'saved');  // Set tab to saved
      router.push(`/venues?${currentParams.toString()}`);
    } else {
      // If coming from search, preserve search params but remove source
      currentParams.delete('source');
      currentParams.set('tab', 'search');
      router.push(`/venues?${currentParams.toString()}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white">
        <div className="bg-[#131d43] border-b border-[#1B2559] mb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Venue Details</h1>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-white hover:text-white hover:bg-[#1B2559] border-[#1B2559]"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-[400px] bg-[#1B2559] animate-pulse rounded-lg mb-8" />
          <div className="space-y-4">
            <div className="h-8 w-1/2 bg-[#1B2559] animate-pulse rounded" />
            <div className="h-4 w-1/4 bg-[#1B2559] animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-[#1B2559] animate-pulse rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-[#0F172A] text-white">
        <div className="bg-[#131d43] border-b border-[#1B2559] mb-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Venue Details</h1>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-white hover:text-white hover:bg-[#1B2559] border-[#1B2559]"
                onClick={handleBack}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Results
              </Button>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl">Venue not found</h2>
        </div>
      </div>
    );
  }

  return (
    <CustomSectionHeader title="Venue Details" underlineColor="#00E396">
    <Card className="bg-[#111C44]  min-h-[500px] border-none p-0 m-0">
    <CardHeader className="pb-0 mb-0">
      <CardTitle className="flex justify-between items-center text-3xl font-bold">
        <div className="">
          <div className="flex flex-auto tracking-tight text-3xl">
          <Button
            variant="outline"
            className="flex items-center gap-2 text-white hover:text-white text-base hover:bg-[#1B2559]  border-1  border-[#1B2559]"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back 
          </Button>
          </div>
        </div>
      </CardTitle>
    </CardHeader>
<CardContent>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-0 lg:px-0">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left Column - Main Info */}
          <div className="md:w-1/2 space-y-6">
            {/* Title and Save Button */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold mb-2">{venue.title}</h1>
                {(venue.address || venue.city || venue.state || venue.zip) && (
                  <div className="flex items-center text-gray-400">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{[venue.address, venue.city, venue.state, venue.zip].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-[#1B2559]"
                onClick={handleSaveToggle}
              >
                <Heart className={isSaved ? 'fill-red-500 text-red-500' : 'text-white'} />
              </Button>
            </div>

            {/* Status Badges */}
            <div className="flex gap-2">
              {venue.verified === 'true' && <Badge variant="default">Verified</Badge>}
              {venue.featured === 'true' && <Badge variant="default">Featured</Badge>}
              {venue.allowsunderagewithguardian === 'true' && <Badge variant="default">All Ages</Badge>}
              {venue.isprivateclub === 'true' && <Badge variant="default">Private Club</Badge>}
              {venue.permanentlyclosed === 'true' && <Badge variant="destructive">Permanently Closed</Badge>}
            </div>

            {/* Venue Details */}
            <Card className="bg-[#192555] border border-blue-500">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Venue Details</h2>
                <div className="space-y-4">
                  {venue.capacity && venue.capacity !== 'null' && (
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-3 text-gray-400" />
                      <span>Capacity: {venue.capacity}</span>
                    </div>
                  )}
                  {venue.agelimit && venue.agelimit !== 'null' && (
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-3 text-gray-400" />
                      <span>Age Limit: {venue.agelimit}+</span>
                    </div>
                  )}
                  {venue.email && venue.email !== 'null' && (
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-3 text-gray-400" />
                      <a href={`mailto:${venue.email}`} className="hover:text-blue-400">{venue.email}</a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Description */}
            {venue.description && venue.description !== 'null' && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="px-6 py-4">
                  <h2 className="text-xl font-semibold mb-4 mt-0 pt-0">Description</h2>
                  <p className="text-gray-300 whitespace-pre-wrap">{venue.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {venue.notes && venue.notes !== 'null' && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Additional Information</h2>
                  <p className="text-gray-300 whitespace-pre-wrap">{venue.notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {venue.venuetype && venue.venuetype !== 'null' && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Tags</h2>
                  <div className="flex flex-wrap gap-2">
                    {venue.venuetype.split(',').map((tag: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="flex items-center bg-[#1e2c6f] text-white hover:bg-[#243285] transition-colors cursor-default text-sm py-1.5 px-3"
                      >
                        <Tag  className="h-4 w-4 mr-1.5" />
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Genres */}
            {venue.genres && venue.genres !== 'null' && venue.genres.length > 0 && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Genres</h2>
                  <div className="flex flex-wrap gap-2">
                    {venue.genres.split(',').map((genre: string, index: number) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        <Music className="h-4 w-4 mr-2" />
                        {genre.trim()}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booking Information */}
            {(venue.bookingname && venue.bookingname !== 'null') || 
             (venue.bookingemail && venue.bookingemail !== 'null') || 
             (venue.bookingphone && venue.bookingphone !== 'null') || 
             (venue.bookinginfo && venue.bookinginfo !== 'null') ? (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
                  <div className="space-y-4">
                    {venue.bookingname && venue.bookingname !== 'null' && (
                      <div className="flex items-center">
                        <User className="h-5 w-5 mr-3 text-gray-400" />
                        <span>{venue.bookingname}</span>
                      </div>
                    )}
                    {venue.bookingemail && venue.bookingemail !== 'null' && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={`mailto:${venue.bookingemail}`}
                          className="text-blue-400 hover:underline"
                        >
                          {venue.bookingemail}
                        </a>
                      </div>
                    )}
                    {venue.bookingphone && venue.bookingphone !== 'null' && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={`tel:${venue.bookingphone}`}
                          className="text-blue-400 hover:underline"
                        >
                          {venue.bookingphone}
                        </a>
                      </div>
                    )}
                    {venue.bookinginfo && venue.bookinginfo !== 'null' && (
                      <p className="text-gray-300 mt-2">{venue.bookinginfo}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          {/* Right Column - Map and Contact */}
          <div className="md:w-1/2 space-y-6">
            {/* Map Section */}
            {venue.latitude && venue.longitude && !isNaN(Number(venue.latitude)) && !isNaN(Number(venue.longitude)) && (
              <Card className="bg-[#192555] border border-blue-500 overflow-hidden">
                <div className="h-[400px] w-full">
                  <Map
                    center={[Number(venue.latitude), Number(venue.longitude)]}
                    zoom={15}
                    className="h-full w-full"
                    markers={[{
                      position: [Number(venue.latitude), Number(venue.longitude)],
                      title: venue.title
                    }]}
                  />
                </div>
              </Card>
            )}

            {/* Contact Information */}
            {((venue.phone && venue.phone !== 'null') || (venue.email && venue.email !== 'null')) && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    {venue.phone && venue.phone !== 'null' && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={`tel:${venue.phone}`}
                          className="text-blue-400 hover:underline"
                        >
                          {venue.phone}
                        </a>
                      </div>
                    )}
                    {venue.email && venue.email !== 'null' && (
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={`mailto:${venue.email}`}
                          className="text-blue-400 hover:underline"
                        >
                          {venue.email}
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Links */}
            {((venue.website && venue.website !== 'null') || 
              (venue.facebook && venue.facebook !== 'null') || 
              (venue.twitter && venue.twitter !== 'null') || 
              (venue.instagram && venue.instagram !== 'null') || 
              (venue.youtube && venue.youtube !== 'null')) && (
              <Card className="bg-[#192555] border border-blue-500">
                <CardHeader>
                  <h2 className="text-xl font-semibold">Links</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  {venue.website && venue.website !== 'null' && (
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.website}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cleanUrl(venue.website)}
                      </a>
                    </div>
                  )}
                  {venue.facebook && venue.facebook !== 'null' && (
                    <div className="flex items-center">
                      <Facebook className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.facebook}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cleanUrl(venue.facebook)}
                      </a>
                    </div>
                  )}
                  {venue.twitter && venue.twitter !== 'null' && (
                    <div className="flex items-center">
                      <Twitter className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.twitter}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cleanUrl(venue.twitter)}
                      </a>
                    </div>
                  )}
                  {venue.instagram && venue.instagram !== 'null' && (
                    <div className="flex items-center">
                      <Instagram className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.instagram}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cleanUrl(venue.instagram)}
                      </a>
                    </div>
                  )}
                  {venue.youtube && venue.youtube !== 'null' && (
                    <div className="flex items-center">
                      <Youtube className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.youtube}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {cleanUrl(venue.youtube)}
                      </a>
                    </div>
                  )}
                  {venue.yelp && venue.yelp !== 'null' && (
                    <div className="flex items-center">
                      <Star className="h-5 w-5 mr-2 text-gray-400" />
                      <a
                        href={venue.yelp}
                        className="text-blue-400 hover:underline truncate"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View on Yelp
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
      </CardContent>
    </Card>
   </CustomSectionHeader>

  );
} 