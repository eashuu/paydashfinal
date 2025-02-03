import React, { useEffect, useState } from 'react';
import { Search, RefreshCw, ChevronDown } from 'lucide-react';
import { supabase } from './lib/supabase';
import type { Participant, Event } from './types/database';
import toast, { Toaster } from 'react-hot-toast';



function App() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<{
    id: number;
    type: string;
  } | null>(null);
  const [searchEventTerm, setSearchEventTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const recordsPerPage = 100; // Number of records to fetch per request

  const fetchParticipants = async (id?: string) => {
    try {
      setLoading(true);
      let query = supabase.from('Participants').select('*', { count: 'exact' });

      if (id) {
        query = query.eq('id', id); // Fetch participant by id if provided
      } else {
        query = query
          .order('id', { ascending: true }) // Order by id in ascending order
          .range(currentPage * recordsPerPage, (currentPage + 1) * recordsPerPage - 1); // Fetch records for the current page
      }

      const { data, error, count } = await query;

      if (error) throw error;

      if (id) {
        setParticipants(data || []); // Set participants to the fetched data
        setTotalParticipants(data.length); // Set total participants to the length of fetched data
        setCurrentPage(0); // Reset to the first page if searching by id
      } else {
        setParticipants(data || []); // Set participants to the fetched data
        setTotalParticipants(count || 0); // Set the total number of participants
        setTotalPages(Math.ceil(count / recordsPerPage)); // Calculate total pages
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      toast.error('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('Events')
        .select('*');

      if (error) throw error;

      // Log the fetched events
      console.log('Fetched events:', data);

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    }
  };

  useEffect(() => {
    fetchParticipants();
    fetchEvents();
  }, [currentPage]);

  const updatePaymentStatus = async (id: number, status: string) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('Participants')
        .update({ Payment: status })
        .eq('id', id);

      if (error) throw error;

      toast.success('Payment status updated successfully');
      fetchParticipants();
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setUpdating(null);
      setOpenDropdown(null);
    }
  };

  const updatePass = async (id: number, passType: string) => {
    try {
      setUpdating(id);
      const updates: { Pass: string; EW?: string } = { Pass: passType };

      if (passType === 'General') {
        updates.EW = 'Registered';
      }

      const { error } = await supabase
        .from('Participants')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Pass updated successfully');
      fetchParticipants();
    } catch (error) {
      console.error('Error updating pass:', error);
      toast.error('Failed to update pass');
    } finally {
      setUpdating(null);
      setOpenDropdown(null);
    }
  };

  const updateConcertPayment = async (id: number) => {
    try {
      setUpdating(id);
      const { error } = await supabase
        .from('Participants')
        .update({ Concert_Payment: 'Successful' })
        .eq('id', id);

      if (error) throw error;

      toast.success('Concert payment updated successfully');
      fetchParticipants();
    } catch (error) {
      console.error('Error updating concert payment:', error);
      toast.error('Failed to update concert payment');
    } finally {
      setUpdating(null);
      setOpenDropdown(null);
    }
  };

  const updateEvent = async (id: number, eventType: string, eventName: string) => {
    try {
      setUpdating(id);
      const updates = { [eventType]: eventName };

      const { error } = await supabase
        .from('Participants')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast.success('Event updated successfully');
      fetchParticipants();
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    } finally {
      setUpdating(null);
      setOpenDropdown(null);
    }
  };

  const getAvailableEvents = (pass: string | null, day: string) => {
    console.log('Checking available events for pass:', pass, 'and day:', day);

    if (!pass) return [];

    const availableEvents = events.filter(event => 
      event.pass === pass 
    );

    console.log('Available events:', availableEvents);
    return availableEvents;
  };

  const filteredParticipants = participants.filter(
    (participant) =>
      participant.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      participant.id.toString().includes(searchTerm.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdown(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const renderEventDropdown = (participant: Participant, eventType: string, day: string) => {
    const availableEvents = getAvailableEvents(participant.Pass, day);
    const currentValue = participant[eventType as keyof Participant];

    // Check if availableEvents is defined and is an array
    if (!Array.isArray(availableEvents)) {
      console.error('Available events is not an array:', availableEvents);
      return null; // Prevent rendering if availableEvents is not valid
    }

    const filteredEvents = availableEvents.filter(event =>
      event.events.toLowerCase().includes(searchEventTerm.toLowerCase())
    );

    const isSignaturePass = participant.Pass === 'Signature';
    console.log('Rendering dropdown for participant:', participant.id, 'with pass:', participant.Pass);
    console.log('Current value:', currentValue);

    return (
      <div className="relative inline-block text-left" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setOpenDropdown({ id: participant.id, type: eventType })}
          className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
            currentValue ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
          }`}
          disabled={participant.Pass !== 'General' && !isSignaturePass}
        >
          {currentValue || 'Not Set'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </button>
        {openDropdown?.id === participant.id && openDropdown.type === eventType && (
          <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <input
                type="text"
                placeholder="Search events..."
                className="w-full pl-2 pr-4 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 mb-2"
                value={searchEventTerm}
                onChange={(e) => setSearchEventTerm(e.target.value)}
              />
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <button
                    key={event.events}
                    onClick={() => updateEvent(participant.id, eventType, event.events)}
                    className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
                  >
                    {event.events}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-gray-500">
                  No events available
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <nav className="bg-blue-600 p-4">
        <h1 className="text-white text-2xl font-bold">Payment Management Dashboard</h1>
      </nav>
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Management Dashboard
            </h1>
            <button
              onClick={fetchParticipants}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (e.target.value) {
                    fetchParticipants(e.target.value); // Fetch participant by id
                  } else {
                    setCurrentPage(0); // Reset to the first page if search is cleared
                    fetchParticipants(); // Fetch all participants
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold">Total Participants</h2>
              <p className="text-2xl font-bold">{totalParticipants}</p>
            </div>
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="text-lg font-semibold">Total Events</h2>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
          </div>

          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Total Records: <span className="font-semibold">{totalParticipants}</span>
                </div>
                {searchTerm && (
                  <div className="text-sm text-gray-600">
                    Filtered Records: <span className="font-semibold">{filteredParticipants.length}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pass Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concert Payment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day 3 Events</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day 4 Events</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">Loading participants...</td>
                    </tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-4 text-center">No participants found</td>
                    </tr>
                  ) : (
                    filteredParticipants.map((participant) => (
                      <tr key={participant.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.Name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{participant.Email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updating === participant.id ? (
                            <span className="text-gray-500">Updating...</span>
                          ) : (
                            <div
                              className="relative inline-block text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  setOpenDropdown({
                                    id: participant.id,
                                    type: 'payment',
                                  })
                                }
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                                  participant.Payment === 'Successful'
                                    ? 'bg-green-100 text-green-800'
                                    : participant.Payment ===
                                      'payment cancelled'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {participant.Payment || 'null'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </button>
                              {openDropdown?.id === participant.id &&
                                openDropdown.type === 'payment' && (
                                  <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                    <div className="py-1">
                                      <button
                                        onClick={() =>
                                          updatePaymentStatus(
                                            participant.id,
                                            'Successful'
                                          )
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100"
                                      >
                                        Mark Successful
                                      </button>
                                      <button
                                        onClick={() =>
                                          updatePaymentStatus(
                                            participant.id,
                                            'payment cancelled'
                                          )
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-100"
                                      >
                                        Mark Cancelled
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updating === participant.id ? (
                            <span className="text-gray-500">Updating...</span>
                          ) : (
                            <div
                              className="relative inline-block text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  setOpenDropdown({
                                    id: participant.id,
                                    type: 'pass',
                                  })
                                }
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                                  participant.Pass
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {participant.Pass || 'Not Set'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </button>
                              {openDropdown?.id === participant.id &&
                                openDropdown.type === 'pass' && (
                                  <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                    <div className="py-1">
                                      <button
                                        onClick={() =>
                                          updatePass(participant.id, 'General')
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-100"
                                      >
                                        General Pass
                                      </button>
                                      <button
                                        onClick={() =>
                                          updatePass(
                                            participant.id,
                                            'Hackathon'
                                          )
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-100"
                                      >
                                        Hackathon Pass
                                      </button>
                                      <button
                                        onClick={() =>
                                          updatePass(
                                            participant.id,
                                            'Signature'
                                          )
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-indigo-700 hover:bg-indigo-100"
                                      >
                                        Signature Pass
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {updating === participant.id ? (
                            <span className="text-gray-500">Updating...</span>
                          ) : (
                            <div
                              className="relative inline-block text-left"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() =>
                                  setOpenDropdown({
                                    id: participant.id,
                                    type: 'concert',
                                  })
                                }
                                className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${
                                  participant.Concert_Payment === 'Successful'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {participant.Concert_Payment || 'Not Set'}
                                <ChevronDown className="ml-2 h-4 w-4" />
                              </button>
                              {openDropdown?.id === participant.id &&
                                openDropdown.type === 'concert' && (
                                  <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                    <div className="py-1">
                                      <button
                                        onClick={() =>
                                          updateConcertPayment(participant.id)
                                        }
                                        className="block w-full text-left px-4 py-2 text-sm text-green-700 hover:bg-green-100"
                                      >
                                        Mark Successful
                                      </button>
                                    </div>
                                  </div>
                                )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-2">
                            {renderEventDropdown(participant, 'Event_1_Day3', 'day3')}
                            {renderEventDropdown(participant, 'Event_2_Day3', 'day3')}
                            {renderEventDropdown(participant, 'Event_3_Day3', 'day3')}
                            {renderEventDropdown(participant, 'Event_4_Day3', 'day3')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderEventDropdown(participant, 'Event_1_Day4', 'day4')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                onClick={() => {
                  setCurrentPage(index); // Set the current page to the clicked page
                  fetchParticipants(); // Fetch participants for the selected page
                }}
                className={`px-4 py-2 mx-1 rounded-md ${currentPage === index ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-blue-500 hover:text-white'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
