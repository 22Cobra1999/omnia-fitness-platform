/**
 * Google OAuth utilities for Google Meet integration
 */

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: 'hangoutsMeet';
      };
    };
  };
  conferenceDataVersion?: number;
}

export class GoogleOAuth {
  private static readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

  /**
   * Generate Google OAuth authorization URL
   */
  static getAuthUrl(redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'https://www.googleapis.com/auth/calendar',
      access_type: 'offline',
      prompt: 'consent',
      state: 'google_meet_integration'
    });

    return `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  static async exchangeCodeForTokens(
    code: string, 
    redirectUri: string
  ): Promise<GoogleTokenResponse> {
    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<GoogleTokenResponse> {
    const response = await fetch(this.GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create Google Calendar event with Meet link
   */
  static async createCalendarEvent(
    accessToken: string,
    event: GoogleCalendarEvent
  ): Promise<GoogleCalendarEvent> {
    console.log('Creating Google Calendar event with Meet...', {
      summary: event.summary,
      start: event.start,
      end: event.end
    });

    const eventData = {
      summary: event.summary,
      description: event.description,
      start: event.start,
      end: event.end,
      attendees: event.attendees,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      }
    };

    console.log('Event data being sent:', JSON.stringify(eventData, null, 2));

    const response = await fetch(`${this.GOOGLE_CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar API error:', error);
      throw new Error(`Calendar event creation failed: ${error}`);
    }

    const result = await response.json();
    console.log('Google Calendar event created successfully:', {
      id: result.id,
      hasConferenceData: !!result.conferenceData,
      conferenceData: result.conferenceData
    });

    return result;
  }

  /**
   * Update Google Calendar event
   */
  static async updateCalendarEvent(
    accessToken: string,
    eventId: string,
    event: GoogleCalendarEvent
  ): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to update calendar event: ${error}`);
    }

    return await response.json();
  }

  /**
   * Get Google Calendar event by ID
   */
  static async getCalendarEvent(
    accessToken: string,
    eventId: string
  ): Promise<GoogleCalendarEvent> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to get calendar event: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Delete Google Calendar event
   */
  static async deleteCalendarEvent(
    accessToken: string,
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `${this.GOOGLE_CALENDAR_API}/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete calendar event: ${response.statusText}`);
    }
  }

  /**
   * Extract Meet link from Google Calendar event
   */
  static extractMeetLink(event: any): string | null {
    console.log('Extracting Meet link from event:', JSON.stringify(event, null, 2));
    
    // Try different possible paths for the Meet link
    const possiblePaths = [
      event.conferenceData?.entryPoints?.[0]?.uri,
      event.conferenceData?.entryPoints?.[0]?.joinUrl,
      event.hangoutLink,
      event.conferenceData?.conferenceSolution?.entryPoints?.[0]?.uri
    ];
    
    for (const path of possiblePaths) {
      if (path && typeof path === 'string' && path.includes('meet.google.com')) {
        console.log('Found Meet link:', path);
        return path;
      }
    }
    
    console.log('No Meet link found in any expected path');
    return null;
  }

  /**
   * Check if token is expired
   */
  static isTokenExpired(expiresAt: Date): boolean {
    return new Date() >= expiresAt;
  }
}

