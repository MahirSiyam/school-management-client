import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Swal from 'sweetalert2'

const CourseManagement = () => {
  const [courses, setCourses] = useState([])
  const [allCourses, setAllCourses] = useState([]) // Store all courses for search
  const [showModal, setShowModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [formData, setFormData] = useState({
    course_code: '',
    course_name: '',
    credits: '',
    description: ''
  })

  const API_URL = 'http://localhost:5000/api'

  // Use useCallback to memoize the function
  const fetchCourses = useCallback(async () => {
    setLoading(true)
    try {
      const response = await axios.get(`${API_URL}/courses`)
      const coursesData = response.data
      
      // Store all courses for search functionality
      setAllCourses(coursesData)
      setCourses(coursesData)
      setIsSearching(false)
    } catch (error) {
      console.error('Error fetching courses:', error)
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Error fetching courses: ' + (error.response?.data?.error || error.message),
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  // Search function
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search term is empty, reset to show all courses
      fetchCourses()
      return
    }

    setLoading(true)
    setIsSearching(true)
    
    const searchTermLower = searchTerm.toLowerCase().trim()
    
    // Filter courses based on search term
    const filteredCourses = allCourses.filter(course => 
      course.course_code.toLowerCase().includes(searchTermLower) ||
      course.course_name.toLowerCase().includes(searchTermLower) ||
      (course.description && course.description.toLowerCase().includes(searchTermLower)) ||
      course.credits.toString().includes(searchTerm)
    )

    setCourses(filteredCourses)
    setLoading(false)
  }

  // Clear search and show all courses
  const handleClearSearch = () => {
    setSearchTerm('')
    fetchCourses()
  }

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const showSuccessAlert = (title, message) => {
    Swal.fire({
      icon: 'success',
      title: title,
      text: message,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false
    })
  }

  const showErrorAlert = (title, message) => {
    Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      confirmButtonColor: '#dc2626'
    })
  }

  const showConfirmDialog = (title, text, confirmButtonText = 'Yes, delete it!') => {
    return Swal.fire({
      title: title,
      text: text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmButtonText,
      cancelButtonText: 'Cancel',
      reverseButtons: true
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const courseData = {
        ...formData,
        credits: parseInt(formData.credits)
      }

      if (editingCourse) {
        await axios.put(`${API_URL}/courses/${editingCourse.id}`, courseData)
        showSuccessAlert('Updated!', 'Course information has been updated successfully.')
      } else {
        await axios.post(`${API_URL}/courses`, courseData)
        showSuccessAlert('Added!', 'New course has been added successfully.')
      }
      setShowModal(false)
      resetForm()
      // If searching, refresh search results, otherwise refresh all courses
      if (isSearching) {
        handleSearch()
      } else {
        fetchCourses()
      }
    } catch (error) {
      console.error('Error saving course:', error)
      showErrorAlert('Error!', 'Error saving course: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (course) => {
    setEditingCourse(course)
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      credits: course.credits.toString(),
      description: course.description || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    const courseToDelete = courses.find(course => course.id === id)
    
    const result = await showConfirmDialog(
      'Are you sure?',
      `You are about to delete course: ${courseToDelete?.course_code} - ${courseToDelete?.course_name}. This action cannot be undone!`,
      'Yes, delete it!'
    )

    if (result.isConfirmed) {
      setLoading(true)
      try {
        await axios.delete(`${API_URL}/courses/${id}`)
        
        // Show success message
        Swal.fire({
          title: 'Deleted!',
          text: 'Course has been deleted successfully.',
          icon: 'success',
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        })

        // If searching, refresh search results, otherwise refresh all courses
        if (isSearching) {
          handleSearch()
        } else {
          fetchCourses()
        }
      } catch (error) {
        console.error('Error deleting course:', error)
        showErrorAlert('Error!', 'Error deleting course: ' + (error.response?.data?.error || error.message))
      } finally {
        setLoading(false)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      course_code: '',
      course_name: '',
      credits: '',
      description: ''
    })
    setEditingCourse(null)
  }

  const handleModalClose = () => {
    // Show confirmation if form has data
    const hasData = Object.values(formData).some(value => value !== '')
    
    if (hasData) {
      Swal.fire({
        title: 'Discard Changes?',
        text: 'You have unsaved changes. Are you sure you want to close?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, discard!',
        cancelButtonText: 'Continue editing'
      }).then((result) => {
        if (result.isConfirmed) {
          setShowModal(false)
          resetForm()
        }
      })
    } else {
      setShowModal(false)
      resetForm()
    }
  }

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Course Management</h1>
            <p className="text-gray-600 mt-1">Manage course catalog and information</p>
          </div>
          <button 
            className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center hover:scale-105 transition-transform"
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
  <form
    onSubmit={(e) => {
      e.preventDefault();
      handleSearch();
    }}
    className="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
  >
    {/* Search Input */}
    <div className="flex-1 relative w-full">
      <input
        type="text"
        placeholder="Search by course code, name, description, or credits..."
        className="input input-bordered w-full pl-10 pr-4 focus:border-primary transition-colors"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={loading}
      />
      <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
    </div>

    {/* Buttons */}
    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <button
        type="submit"
        className="btn btn-primary p-2 flex-1 sm:flex-none hover:scale-105 transition-transform flex items-center justify-center"
        disabled={loading}
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        Search
      </button>

      {searchTerm && (
        <button
          type="button"
          className="btn btn-ghost p-2 flex-1 sm:flex-none hover:scale-105 transition-transform hover:bg-gray-200 flex items-center justify-center"
          onClick={handleClearSearch}
          disabled={loading}
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
          Clear
        </button>
      )}
    </div>
  </form>

  {/* Search Info */}
  {isSearching && (
    <div className="mt-2 text-sm text-gray-600">
      Showing {courses.length} search results for "{searchTerm}"
    </div>
  )}
</div>


        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Course Form Modal */}
        {showModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl sm:text-2xl">
                  {editingCourse ? 'Edit Course' : 'Add New Course'}
                </h3>
                <button 
                  className="btn btn-sm btn-circle btn-ghost hover:bg-gray-200 transition-colors"
                  onClick={handleModalClose}
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Course Code *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., CS101"
                      value={formData.course_code}
                      onChange={(e) => setFormData({...formData, course_code: e.target.value})}
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Course Name *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., Introduction to Computer Science"
                      value={formData.course_name}
                      onChange={(e) => setFormData({...formData, course_name: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Credits *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered w-full focus:border-primary transition-colors"
                    min="1"
                    max="6"
                    placeholder="e.g., 3"
                    value={formData.credits}
                    onChange={(e) => setFormData({...formData, credits: e.target.value})}
                    required
                  />
                  <label className="label">
                    <span className="label-text-alt text-gray-500">Typically 1-6 credits</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Description</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered w-full h-24 focus:border-primary transition-colors"
                    placeholder="Course description..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="modal-action flex-col sm:flex-row gap-2">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-full sm:w-auto hover:scale-105 transition-transform"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingCourse ? 'Updating...' : 'Adding...'}
                      </span>
                    ) : (
                      editingCourse ? 'Update Course' : 'Add Course'
                    )}
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-ghost w-full sm:w-auto hover:bg-gray-200 transition-colors"
                    onClick={handleModalClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
            
            {/* Backdrop click to close */}
            <div className="modal-backdrop" onClick={handleModalClose}></div>
          </div>
        )}

        {/* Courses Display */}
        {!loading && (
          <>
            {/* Mobile List View */}
            <div className="block sm:hidden space-y-4">
              {courses.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg shadow">
                  <div className="text-gray-500 text-lg mb-4">
                    {isSearching ? 'No courses found matching your search.' : 'No courses found.'}
                  </div>
                  {!isSearching && (
                    <button 
                      className="btn btn-primary hover:scale-105 transition-transform"
                      onClick={() => setShowModal(true)}
                    >
                      Add First Course
                    </button>
                  )}
                </div>
              ) : (
                courses.map((course) => (
                  <div key={course.id} className="card bg-base-100 shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h2 className="card-title text-xl text-primary mb-1">
                            {course.course_code}
                          </h2>
                          <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                            {course.course_name}
                          </h3>
                        </div>
                        <div className="badge badge-primary badge-lg ml-2">
                          {course.credits} Cr
                        </div>
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description || 'No description provided.'}
                      </p>
                      
                      <div className="card-actions justify-between">
                        <button 
                          className="btn border-1 border-black btn-sm flex-1 mr-2 hover:scale-105 transition-transform"
                          onClick={() => handleEdit(course)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button 
                          className="btn btn-error btn-sm flex-1 hover:scale-105 transition-transform"
                          onClick={() => handleDelete(course.id)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Tablet Grid View */}
            <div className="hidden sm:block lg:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.length === 0 ? (
                  <div className="col-span-2 text-center py-12 bg-white rounded-lg shadow">
                    <div className="text-gray-500 text-lg mb-4">
                      {isSearching ? 'No courses found matching your search.' : 'No courses found.'}
                    </div>
                    {!isSearching && (
                      <button 
                        className="btn btn-primary hover:scale-105 transition-transform"
                        onClick={() => setShowModal(true)}
                      >
                        Add First Course
                      </button>
                    )}
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                      <div className="card-body">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h2 className="card-title text-xl text-primary">{course.course_code}</h2>
                            <h3 className="font-semibold text-gray-800 mt-1 text-sm leading-tight">
                              {course.course_name}
                            </h3>
                          </div>
                          <div className="badge badge-primary badge-lg">
                            {course.credits} Credit{course.credits !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 text-sm flex-grow">
                          {course.description || 'No description provided.'}
                        </p>
                        
                        <div className="card-actions justify-end mt-4">
                          <button 
                            className="btn border-1 border-black btn-sm hover:scale-105 transition-transform"
                            onClick={() => handleEdit(course)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            className="btn btn-error btn-sm hover:scale-105 transition-transform"
                            onClick={() => handleDelete(course.id)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                  <div className="col-span-3 text-center py-16 bg-white rounded-lg shadow">
                    <div className="text-gray-500 text-xl mb-4">
                      {isSearching ? 'No courses found matching your search.' : 'No courses found in the catalog.'}
                    </div>
                    {!isSearching && (
                      <button 
                        className="btn btn-primary hover:scale-105 transition-transform"
                        onClick={() => setShowModal(true)}
                      >
                        Add First Course
                      </button>
                    )}
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="card bg-base-100 shadow-lg hover:shadow-md transition-all duration-300 hover:-translate-y-1">
                      <div className="card-body">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h2 className="card-title text-2xl text-primary">{course.course_code}</h2>
                            <h3 className="text-lg font-semibold mt-2 text-gray-800">{course.course_name}</h3>
                          </div>
                          <div className="badge badge-primary badge-lg p-4 text-white">
                            {course.credits} Credit{course.credits !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 flex-grow">
                          {course.description || 'No description provided.'}
                        </p>
                        
                        <div className="card-actions justify-end mt-6">
                          <button 
                            className="btn border-1 border-black btn-sm hover:scale-105 transition-transform"
                            onClick={() => handleEdit(course)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button 
                            className="btn btn-error btn-sm hover:scale-105 transition-transform"
                            onClick={() => handleDelete(course.id)}
                          >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Course Count */}
            {courses.length > 0 && (
              <div className="mt-6 text-center sm:text-left">
                <div className="text-sm text-gray-600">
                  Showing {courses.length} course{courses.length !== 1 ? 's' : ''} 
                  {isSearching ? ` matching "${searchTerm}"` : ' in catalog'}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CourseManagement