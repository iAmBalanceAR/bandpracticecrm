# Venue Search Documentation

## Overview
The venue search functionality allows users to search through approximately 48,000 venues with filtering, sorting, and completeness scoring capabilities.

## Database Function: search_venues_with_completeness

### Purpose
This function handles venue searching with:
- Text-based search
- Multiple filter criteria
- Completeness scoring
- Sorting by various fields
- Pagination

### Parameters
```sql
p_query TEXT                  -- Search text for venue title
p_city TEXT                  -- City filter
p_state TEXT                 -- State filter
p_venue_type TEXT           -- Venue type filter
p_capacity TEXT             -- Minimum capacity filter
p_verified TEXT             -- Verified status filter
p_featured TEXT             -- Featured status filter
p_allows_underage TEXT      -- Underage policy filter
p_has_bar TEXT             -- Bar availability filter
p_has_stage TEXT           -- Stage availability filter
p_has_sound_system TEXT    -- Sound system filter
p_has_lighting_system TEXT -- Lighting system filter
p_has_parking TEXT         -- Parking availability filter
p_sort_by TEXT             -- Sort field
p_sort_order TEXT          -- Sort direction (asc/desc)
p_limit INTEGER            -- Page size
p_offset INTEGER           -- Page offset
```

### Return Fields
```sql
id text
created_at timestamptz
title text
description text
address text
city text
state text
zip text
phone text
email text
website text
capacity text
venuetype text
verified text
featured text
allowsunderagewithguardian text
isprivateclub text
rating text
latitude text
longitude text
completeness_score integer
total_count bigint
```

### Important Notes
1. All venue fields (except timestamps) are stored as TEXT in the database
2. The completeness_score is calculated using the venue_completeness_score function
3. Results are sorted by completeness_score DESC first, then by user-selected criteria
4. Total count is included in each row for pagination

## Current Issues/Bugs
1. Total count not displaying correctly (showing 0 instead of ~48,000)
2. Completeness sorting may not be working as expected

## Required Fixes
1. Fix total_count calculation in the SQL function
2. Verify completeness score calculation and sorting

## SQL Function History
Keep track of working versions here for reference.

### Version 2024-02-14 (Current)
- Added total_count to return fields
- Modified ORDER BY clause for completeness sorting
- Issues with count calculation

### Previous Working Version
[Insert previous working SQL here when recovered] 