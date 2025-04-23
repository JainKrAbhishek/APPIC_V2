// Empty and no-matching states for the user management UI

// Empty user state component
export const EmptyUserState = () => (
  <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
    <div className="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>No users found</span>
    </div>
  </div>
);

// No matching users state component
export const NoMatchingUsersState = () => (
  <div className="text-center py-8 text-gray-500 bg-slate-50 rounded-lg">
    <div className="flex flex-col items-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <span>No matching users found</span>
    </div>
  </div>
);