import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Store all students for search
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    name: "",
    email: "",
    phone: "",
    date_of_birth: "",
  });

  const API_URL = "http://localhost:5000/api";
  const STUDENTS_PER_PAGE = 15;

  // Use useCallback to memoize the function and avoid dependency issues
  const fetchStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/students`);
      let studentsData = response.data;

      // Store all students for search functionality
      setAllStudents(studentsData);

      // Sort by ID in descending order (newest first)
      studentsData = studentsData.sort((a, b) => b.id - a.id);

      // Calculate pagination
      const total = studentsData.length;
      const totalPages = Math.ceil(total / STUDENTS_PER_PAGE);
      const startIndex = (page - 1) * STUDENTS_PER_PAGE;
      const endIndex = startIndex + STUDENTS_PER_PAGE;
      const paginatedStudents = studentsData.slice(startIndex, endIndex);

      setStudents(paginatedStudents);
      setTotalStudents(total);
      setTotalPages(totalPages);
      setCurrentPage(page);
      setIsSearching(false);
    } catch (error) {
      console.error("Error fetching students:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          "Error fetching students: " +
          (error.response?.data?.error || error.message),
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(1);
  }, [fetchStudents]);

  // Search function
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // If search term is empty, reset to show all students
      fetchStudents(1);
      return;
    }

    setLoading(true);
    setIsSearching(true);

    const searchTermLower = searchTerm.toLowerCase().trim();

    // Filter students based on search term
    const filteredStudents = allStudents.filter(
      (student) =>
        student.student_id.toLowerCase().includes(searchTermLower) ||
        student.name.toLowerCase().includes(searchTermLower) ||
        student.email.toLowerCase().includes(searchTermLower) ||
        (student.phone && student.phone.includes(searchTerm)) ||
        (student.date_of_birth && student.date_of_birth.includes(searchTerm))
    );

    // Sort filtered results by ID descending (newest first)
    const sortedFilteredStudents = filteredStudents.sort((a, b) => b.id - a.id);

    // Calculate pagination for filtered results
    const total = sortedFilteredStudents.length;
    const totalPages = Math.ceil(total / STUDENTS_PER_PAGE);
    const startIndex = 0;
    const endIndex = Math.min(STUDENTS_PER_PAGE, total);
    const paginatedStudents = sortedFilteredStudents.slice(
      startIndex,
      endIndex
    );

    setStudents(paginatedStudents);
    setTotalStudents(total);
    setTotalPages(totalPages);
    setCurrentPage(1);
    setLoading(false);
  };

  // Clear search and show all students
  const handleClearSearch = () => {
    setSearchTerm("");
    fetchStudents(1);
  };

  // Handle Enter key press in search input
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const showSuccessAlert = (title, message) => {
    Swal.fire({
      icon: "success",
      title: title,
      text: message,
      timer: 2000,
      timerProgressBar: true,
      showConfirmButton: false,
    });
  };

  const showErrorAlert = (title, message) => {
    Swal.fire({
      icon: "error",
      title: title,
      text: message,
      confirmButtonColor: "#dc2626",
    });
  };

  const showConfirmDialog = (
    title,
    text,
    confirmButtonText = "Yes, delete it!"
  ) => {
    return Swal.fire({
      title: title,
      text: text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: confirmButtonText,
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingStudent) {
        await axios.put(`${API_URL}/students/${editingStudent.id}`, formData);
        showSuccessAlert(
          "Updated!",
          "Student information has been updated successfully."
        );
        setShowModal(false);
        resetForm();
        // If searching, refresh search results, otherwise refresh current page
        if (isSearching) {
          handleSearch();
        } else {
          fetchStudents(currentPage);
        }
      } else {
        await axios.post(`${API_URL}/students`, formData);
        showSuccessAlert("Added!", "New student has been added successfully.");
        setShowModal(false);
        resetForm();
        // After adding new student, if searching, refresh search, otherwise go to first page
        if (isSearching) {
          handleSearch();
        } else {
          fetchStudents(1);
        }
      }
    } catch (error) {
      console.error("Error saving student:", error);
      showErrorAlert(
        "Error!",
        "Error saving student: " +
          (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      phone: student.phone || "",
      date_of_birth: student.date_of_birth || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const studentToDelete = students.find((student) => student.id === id);

    const result = await showConfirmDialog(
      "Are you sure?",
      `You are about to delete student: ${studentToDelete?.name} (${studentToDelete?.student_id}). This action cannot be undone!`,
      "Yes, delete it!"
    );

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/students/${id}`);

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "Student has been deleted successfully.",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // If searching, refresh search results, otherwise handle pagination
        if (isSearching) {
          handleSearch();
        } else {
          // If we're on the last page and it becomes empty after deletion, go to previous page
          if (students.length === 1 && currentPage > 1) {
            fetchStudents(currentPage - 1);
          } else {
            fetchStudents(currentPage);
          }
        }
      } catch (error) {
        console.error("Error deleting student:", error);
        showErrorAlert(
          "Error!",
          "Error deleting student: " +
            (error.response?.data?.error || error.message)
        );
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      name: "",
      email: "",
      phone: "",
      date_of_birth: "",
    });
    setEditingStudent(null);
  };

  const handleModalClose = () => {
    // Show confirmation if form has data
    const hasData = Object.values(formData).some((value) => value !== "");

    if (hasData) {
      Swal.fire({
        title: "Discard Changes?",
        text: "You have unsaved changes. Are you sure you want to close?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, discard!",
        cancelButtonText: "Continue editing",
      }).then((result) => {
        if (result.isConfirmed) {
          setShowModal(false);
          resetForm();
        }
      });
    } else {
      setShowModal(false);
      resetForm();
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      if (isSearching) {
        // Handle pagination for search results
        const searchTermLower = searchTerm.toLowerCase().trim();
        const filteredStudents = allStudents.filter(
          (student) =>
            student.student_id.toLowerCase().includes(searchTermLower) ||
            student.name.toLowerCase().includes(searchTermLower) ||
            student.email.toLowerCase().includes(searchTermLower) ||
            (student.phone && student.phone.includes(searchTerm)) ||
            (student.date_of_birth &&
              student.date_of_birth.includes(searchTerm))
        );

        const sortedFilteredStudents = filteredStudents.sort(
          (a, b) => b.id - a.id
        );
        const startIndex = (newPage - 1) * STUDENTS_PER_PAGE;
        const endIndex = startIndex + STUDENTS_PER_PAGE;
        const paginatedStudents = sortedFilteredStudents.slice(
          startIndex,
          endIndex
        );

        setStudents(paginatedStudents);
        setCurrentPage(newPage);
      } else {
        fetchStudents(newPage);
      }
    }
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Near the start
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Student Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage student records and information
            </p>
          </div>
          <button
            className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center hover:scale-105 transition-transform"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Student
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search Input */}
            <div className="flex-1 relative w-full">
              <input
                type="text"
                placeholder="Search by ID, name, email, phone, or date of birth..."
                className="input input-bordered w-full pl-10 pr-4 focus:border-primary transition-colors"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <svg
                className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
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

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                className="btn btn-primary p-2 flex-1 sm:flex-none hover:scale-105 transition-transform flex items-center justify-center"
                onClick={handleSearch}
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

              {isSearching && (
                <button
                  className="btn btn-ghost p-2 flex-1 sm:flex-none hover:scale-105 transition-transform flex items-center justify-center"
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
          </div>

          {/* Search Info */}
          {isSearching && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {totalStudents} search results for "{searchTerm}"
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Student Form Modal */}
        {showModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl sm:text-2xl">
                  {editingStudent ? "Edit Student" : "Add New Student"}
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
                      <span className="label-text font-semibold">
                        Student ID *
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., S001"
                      value={formData.student_id}
                      onChange={(e) =>
                        setFormData({ ...formData, student_id: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Full Name *
                      </span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., John Doe"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Email *</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Phone</span>
                    </label>
                    <input
                      type="tel"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      placeholder="e.g., 123-456-7890"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Date of Birth
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered w-full focus:border-primary transition-colors"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date_of_birth: e.target.value,
                      })
                    }
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
                        {editingStudent ? "Updating..." : "Adding..."}
                      </span>
                    ) : editingStudent ? (
                      "Update Student"
                    ) : (
                      "Add Student"
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

        {/* Students Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block sm:hidden">
              {students.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg">
                    {isSearching
                      ? "No students found matching your search."
                      : "No students found."}
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {students.map((student) => (
                    <div
                      key={student.id}
                      className="p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">
                            {student.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            ID: {student.student_id}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            className="btn btn-sm btn-square hover:scale-110 transition-transform"
                            onClick={() => handleEdit(student)}
                            title="Edit"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </button>
                          <button
                            className="btn btn-error btn-sm btn-square hover:scale-110 transition-transform"
                            onClick={() => handleDelete(student.id)}
                            title="Delete"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-gray-700">{student.email}</span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <span className="text-gray-700">
                            {student.phone || "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-gray-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-gray-700">
                            {student.date_of_birth || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="font-bold">Student ID</th>
                    <th className="font-bold">Name</th>
                    <th className="font-bold">Email</th>
                    <th className="font-bold">Phone</th>
                    <th className="font-bold">Date of Birth</th>
                    <th className="font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <div className="text-gray-500 text-lg">
                          {isSearching
                            ? "No students found matching your search."
                            : "No students found."}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="font-semibold">{student.student_id}</td>
                        <td>
                          <div className="flex items-center space-x-3">
                            <div>
                              <div className="font-bold">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td>{student.email}</td>
                        <td>{student.phone || "N/A"}</td>
                        <td>{student.date_of_birth || "N/A"}</td>
                        <td>
                          <div className="flex space-x-2">
                            <button
                              className="btn btn-sm hover:scale-105 transition-transform"
                              onClick={() => handleEdit(student)}
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Edit
                            </button>
                            <button
                              className="btn btn-error btn-sm hover:scale-105 transition-transform"
                              onClick={() => handleDelete(student.id)}
                            >
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {students.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * STUDENTS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * STUDENTS_PER_PAGE, totalStudents)}{" "}
                    of {totalStudents} students
                    {isSearching && ` for "${searchTerm}"`}
                  </div>

                  <div className="flex items-center space-x-1">
                    {/* Previous Button */}
                    <button
                      className="btn btn-sm btn-ghost hover:scale-105 transition-transform"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      Previous
                    </button>

                    {/* Page Numbers */}
                    {generatePageNumbers().map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${index}`}
                          className="px-2 text-gray-500"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          className={`btn btn-sm ${
                            currentPage === page ? "btn-primary" : "btn-ghost"
                          } hover:scale-105 transition-transform`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next Button */}
                    <button
                      className="btn btn-sm btn-ghost hover:scale-105 transition-transform"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentManagement;
