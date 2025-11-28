import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const MarksManagement = () => {
  const [marks, setMarks] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMark, setEditingMark] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMarks, setTotalMarks] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    student_id: "",
    course_id: "",
    marks_obtained: "",
    total_marks: "100",
    semester: "",
  });

  const API_URL = "https://school-management-server-beta.vercel.app/api";
  const MARKS_PER_PAGE = 15;

  // Memoized data fetching functions
  const fetchMarks = useCallback(async (page = 1, searchQuery = "") => {
    try {
      const response = await axios.get(`${API_URL}/marks`);
      let allMarks = response.data;

      // Apply search filter if search query exists
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        allMarks = allMarks.filter(
          (mark) =>
            mark.student_name.toLowerCase().includes(query) ||
            mark.student_id.toLowerCase().includes(query) ||
            mark.course_name.toLowerCase().includes(query) ||
            mark.course_code.toLowerCase().includes(query) ||
            mark.semester.toLowerCase().includes(query) ||
            mark.marks_obtained.toString().includes(query) ||
            mark.percentage.toString().includes(query)
        );
        setIsSearching(true);
      } else {
        setIsSearching(false);
      }

      // Sort marks in descending order by ID (newest first)
      allMarks.sort((a, b) => b.id - a.id);

      // Calculate pagination
      const total = allMarks.length;
      const totalPages = Math.ceil(total / MARKS_PER_PAGE);
      const startIndex = (page - 1) * MARKS_PER_PAGE;
      const endIndex = startIndex + MARKS_PER_PAGE;
      const paginatedMarks = allMarks.slice(startIndex, endIndex);

      setMarks(paginatedMarks);
      setTotalMarks(total);
      setTotalPages(totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error("Error fetching marks:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          "Error fetching marks: " +
          (error.response?.data?.error || error.message),
        confirmButtonColor: "#dc2626",
      });
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/students`);
      setStudents(response.data);
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
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error("Error fetching courses:", error);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text:
          "Error fetching courses: " +
          (error.response?.data?.error || error.message),
        confirmButtonColor: "#dc2626",
      });
    }
  }, []);

  // Data fetching function
  const fetchAllData = useCallback(
    async (page = 1, searchQuery = "") => {
      setLoading(true);
      try {
        await Promise.all([
          fetchMarks(page, searchQuery),
          fetchStudents(),
          fetchCourses(),
        ]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    },
    [fetchMarks, fetchStudents, fetchCourses]
  );

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
      const markData = {
        ...formData,
        marks_obtained: parseFloat(formData.marks_obtained),
        total_marks: parseFloat(formData.total_marks),
      };

      if (editingMark) {
        await axios.put(`${API_URL}/marks/${editingMark.id}`, markData);
        showSuccessAlert(
          "Updated!",
          "Marks record has been updated successfully."
        );
      } else {
        await axios.post(`${API_URL}/marks`, markData);
        showSuccessAlert(
          "Added!",
          "New marks record has been added successfully."
        );
      }
      setShowModal(false);
      resetForm();
      // After adding/editing, refresh data and go to first page to show newest data on top
      fetchMarks(1, searchTerm);
    } catch (error) {
      console.error("Error saving marks:", error);
      showErrorAlert(
        "Error!",
        "Error saving marks: " + (error.response?.data?.error || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (mark) => {
    setEditingMark(mark);
    setFormData({
      student_id: mark.student_id.toString(),
      course_id: mark.course_id.toString(),
      marks_obtained: mark.marks_obtained.toString(),
      total_marks: mark.total_marks.toString(),
      semester: mark.semester,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const markToDelete = marks.find((mark) => mark.id === id);
    const studentName = markToDelete?.student_name;
    const courseName = markToDelete?.course_name;
    const marksValue = `${parseFloat(markToDelete?.marks_obtained).toFixed(
      1
    )}/${parseFloat(markToDelete?.total_marks).toFixed(1)}`;

    const result = await showConfirmDialog(
      "Are you sure?",
      `You are about to delete marks record for: ${studentName} in ${courseName} (${marksValue}). This action cannot be undone!`,
      "Yes, delete it!"
    );

    if (result.isConfirmed) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/marks/${id}`);

        // Show success message
        Swal.fire({
          title: "Deleted!",
          text: "Marks record has been deleted successfully.",
          icon: "success",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // If we're on the last page and it becomes empty after deletion, go to previous page
        if (marks.length === 1 && currentPage > 1) {
          fetchMarks(currentPage - 1, searchTerm);
        } else {
          fetchMarks(currentPage, searchTerm);
        }
      } catch (error) {
        console.error("Error deleting marks:", error);
        showErrorAlert(
          "Error!",
          "Error deleting marks: " +
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
      course_id: "",
      marks_obtained: "",
      total_marks: "100",
      semester: "",
    });
    setEditingMark(null);
  };

  const handleModalClose = () => {
    // Show confirmation if form has data
    const hasData = Object.values(formData).some(
      (value) => value !== "" && value !== "100"
    );

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
      fetchMarks(newPage, searchTerm);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMarks(1, searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    fetchMarks(1);
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

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: "A+", color: "badge-success" };
    if (percentage >= 80) return { grade: "A", color: "badge-success" };
    if (percentage >= 70) return { grade: "B", color: "badge-warning" };
    if (percentage >= 60) return { grade: "C", color: "badge-warning" };
    if (percentage >= 50) return { grade: "D", color: "badge-error" };
    return { grade: "F", color: "badge-error" };
  };

  const getGradePoint = (percentage) => {
    if (percentage >= 90) return 4.0;
    if (percentage >= 80) return 3.5;
    if (percentage >= 70) return 3.0;
    if (percentage >= 60) return 2.5;
    if (percentage >= 50) return 2.0;
    return 0.0;
  };

  // Use useEffect with the data fetching function
  useEffect(() => {
    fetchAllData(1);
  }, [fetchAllData]);

  return (
    <div className="p-4 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Marks Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage student grades and performance
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
            Add Marks
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col md:flex-row gap-4 items-start md:items-center"
          >
            {/* Search Input */}
            <div className="flex-1 w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by student name, ID, course, semester, marks..."
                  className="input input-bordered w-full pl-10 pr-4 focus:border-primary transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
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
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                type="submit"
                className="btn btn-primary p-2 flex-1 sm:flex-none hover:scale-105 transition-transform flex items-center justify-center"
                disabled={loading}
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                  className="btn btn-ghost p-2 flex-1 sm:flex-none hover:scale-105 transition-transform hover:bg-gray-200 transition-colors flex items-center justify-center"
                  onClick={handleClearSearch}
                  disabled={loading}
                >
                  <svg
                    className="w-4 h-4 mr-2"
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
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-sm text-gray-600">
                Showing {totalMarks} search results for "{searchTerm}"
              </span>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Marks Form Modal */}
        {showModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-xl sm:text-2xl">
                  {editingMark ? "Edit Marks" : "Add Student Marks"}
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
                        Student *
                      </span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:border-primary transition-colors"
                      value={formData.student_id}
                      onChange={(e) =>
                        setFormData({ ...formData, student_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.name} ({student.student_id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Course *</span>
                    </label>
                    <select
                      className="select select-bordered w-full focus:border-primary transition-colors"
                      value={formData.course_id}
                      onChange={(e) =>
                        setFormData({ ...formData, course_id: e.target.value })
                      }
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map((course) => (
                        <option key={course.id} value={course.id}>
                          {course.course_name} ({course.course_code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Marks Obtained *
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      min="0"
                      step="0.01"
                      placeholder="0-100"
                      value={formData.marks_obtained}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          marks_obtained: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">
                        Total Marks
                      </span>
                    </label>
                    <input
                      type="number"
                      className="input input-bordered w-full focus:border-primary transition-colors"
                      min="1"
                      step="0.01"
                      placeholder="100"
                      value={formData.total_marks}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          total_marks: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Semester *</span>
                  </label>
                  <select
                    className="select select-bordered w-full focus:border-primary transition-colors"
                    value={formData.semester}
                    onChange={(e) =>
                      setFormData({ ...formData, semester: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Semester</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="3rd Semester">3rd Semester</option>
                    <option value="4th Semester">4th Semester</option>
                    <option value="5th Semester">5th Semester</option>
                    <option value="6th Semester">6th Semester</option>
                    <option value="7th Semester">7th Semester</option>
                    <option value="8th Semester">8th Semester</option>
                  </select>
                </div>

                {formData.marks_obtained && formData.total_marks && (
                  <div className="bg-base-200 p-4 rounded-lg">
                    <div className="text-lg font-semibold">Preview:</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                      <div>
                        Percentage:{" "}
                        <strong>
                          {(
                            (parseFloat(formData.marks_obtained) /
                              parseFloat(formData.total_marks)) *
                            100
                          ).toFixed(2)}
                          %
                        </strong>
                      </div>
                      <div>
                        Grade:{" "}
                        <strong>
                          {
                            getGrade(
                              (parseFloat(formData.marks_obtained) /
                                parseFloat(formData.total_marks)) *
                                100
                            ).grade
                          }
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                <div className="modal-action flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    className="btn btn-primary w-full sm:w-auto hover:scale-105 transition-transform"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {editingMark ? "Updating..." : "Saving..."}
                      </span>
                    ) : editingMark ? (
                      "Update Marks"
                    ) : (
                      "Save Marks"
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

        {/* Marks Display */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              {marks.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 text-lg mb-4">
                    {isSearching
                      ? "No marks records found for your search."
                      : "No marks records found."}
                  </div>
                  {!isSearching && (
                    <button
                      className="btn btn-primary hover:scale-105 transition-transform"
                      onClick={() => setShowModal(true)}
                    >
                      Add First Marks Entry
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y">
                  {marks.map((record) => {
                    const percentage = parseFloat(record.percentage);
                    const gradeInfo = getGrade(percentage);
                    const gradePoint = getGradePoint(percentage);
                    return (
                      <div
                        key={record.id}
                        className="p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg">
                              {record.student_name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {record.student_id}
                            </p>
                            <p className="font-semibold text-primary mt-1">
                              {record.course_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {record.course_code}
                            </p>
                          </div>
                          <span
                            className={`badge ${gradeInfo.color} text-white w-7`}
                          >
                            {gradeInfo.grade}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="text-sm text-gray-600">Marks</div>
                            <div className="font-bold text-primary">
                              {parseFloat(record.marks_obtained).toFixed(1)} /{" "}
                              {parseFloat(record.total_marks).toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Percentage
                            </div>
                            <div className="font-bold">
                              {percentage.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Grade Point
                            </div>
                            <div className="font-semibold">
                              {gradePoint.toFixed(1)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Semester
                            </div>
                            <span className="badge badge-outline">
                              {record.semester}
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <button
                            className="btn btn-sm flex-1 hover:scale-105 transition-transform"
                            onClick={() => handleEdit(record)}
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
                            className="btn btn-error btn-sm flex-1 hover:scale-105 transition-transform"
                            onClick={() => handleDelete(record.id)}
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Tablet and Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="font-bold">Student</th>
                    <th className="font-bold">Course</th>
                    <th className="font-bold">Marks</th>
                    <th className="font-bold">Percentage</th>
                    <th className="font-bold">Grade</th>
                    <th className="font-bold">Grade Point</th>
                    <th className="font-bold">Semester</th>
                    <th className="font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {marks.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-8">
                        <div className="text-gray-500 text-lg mb-4">
                          {isSearching
                            ? "No marks records found for your search."
                            : "No marks records found."}
                        </div>
                        {!isSearching && (
                          <button
                            className="btn btn-primary hover:scale-105 transition-transform"
                            onClick={() => setShowModal(true)}
                          >
                            Add First Marks Entry
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    marks.map((record) => {
                      const percentage = parseFloat(record.percentage);
                      const gradeInfo = getGrade(percentage);
                      const gradePoint = getGradePoint(percentage);
                      return (
                        <tr
                          key={record.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td>
                            <div className="flex items-center space-x-3">
                              <div>
                                <div className="font-bold">
                                  {record.student_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {record.student_id}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-semibold">
                                {record.course_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {record.course_code}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="font-bold text-primary">
                                {parseFloat(record.marks_obtained).toFixed(1)} /{" "}
                                {parseFloat(record.total_marks).toFixed(1)}
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="font-bold">
                              {percentage.toFixed(1)}%
                            </div>
                          </td>
                          <td>
                            <span
                              className={`badge ${gradeInfo.color} text-white w-7`}
                            >
                              {gradeInfo.grade}
                            </span>
                          </td>
                          <td>
                            <div className="font-semibold">
                              {gradePoint.toFixed(1)}
                            </div>
                          </td>
                          <td>
                            <span className="badge badge-outline">
                              {record.semester}
                            </span>
                          </td>
                          <td>
                            <div className="flex space-x-2">
                              <button
                                className="btn btn-sm border-1 border-black hover:scale-105 transition-transform"
                                onClick={() => handleEdit(record)}
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
                                onClick={() => handleDelete(record.id)}
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
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {marks.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * MARKS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * MARKS_PER_PAGE, totalMarks)} of{" "}
                    {totalMarks} marks records
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

export default MarksManagement;
