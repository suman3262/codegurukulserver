const Category = require("../models/category");

// create CATAGORY
exports.createCatagory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.json({
        success: false,
        message: "all field are require",
      });
    }
    // create a tga in to DB
    const Details = await Category.create({
      name: name,
      description: description,
    });

    return res.status(200).json({
      success: true,
      message: " created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// get all the category
exports.getAllcategory = async (req, res) => {
  try {
    const allCategory = await Category.find(
      {},
      { name: true, description: true }
    );

    return res.status(200).json({
      success: true,
      message: "get all s successfully",
      data: allCategory,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error i fetching categort",
    });
  }
};

// category page details
// this controler are little-bit confusing
exports.categoryPageDetails = async (req, res) => {
  try {
    const { categoryID } = req.body;

    // Get courses for the specified category
    const selectedCategory = await Category.findById(categoryID)
      .populate({
        path: "course",
        populate: [
          {
            path: "instructor",
          },
          {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
          {
            path: "ratingAndReviews", // Populating the ratingAndReviews array
            populate: {
              path: "user", // Assuming you have a reference to the user who left the review
              model: "User", // Change "User" to the actual model name if different
            },
          },
        ],
      })
      .exec();

    // Handle the case when the category is not found
    if (!selectedCategory) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
    // Handle the case when there are no courses
    if (selectedCategory.course.length === 0) {
      console.log("No courses found for the selected category.");
      return res.status(404).json({
        success: false,
        message: "No courses found for the selected category.",
      });
    }
    //***beed to add instructor Name */

    const selectedCourses = selectedCategory.course;

    // Get courses for other categories
    // [$ne] stand for not equal // get all course that not equal to get category ID
    //this type of populate , idea of nested populate the data
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryID },
    })
      .populate({
        path: "course",
        populate: [
          {
            path: "instructor",
          },
          {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
          {
            path: "ratingAndReviews", // Populating the ratingAndReviews array
            populate: {
              path: "user", // Assuming you have a reference to the user who left the review
              model: "User", // Change "User" to the actual model name if different
            },
          },
        ],
      })
      .exec();

    let differentCourses = [];

    for (const category of categoriesExceptSelected) {
      differentCourses.push(...category.course);
    }

    // Get top-selling courses across all categories
    const allCategories = await Category.find({})
      .populate({
        path: "course",
        populate: [
          {
            path: "instructor",
          },
          {
            path: "courseContent",
            populate: {
              path: "subSection",
            },
          },
          {
            path: "ratingAndReviews", // Populating the ratingAndReviews array
            populate: {
              path: "user", // Assuming you have a reference to the user who left the review
              model: "User", // Change "User" to the actual model name if different
            },
          },
        ],
      })
      .exec();

    const allCourses = allCategories.flatMap((category) => category.course);
    const mostSellingCourses = allCourses
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    res.status(200).json({
      selectedCourses: selectedCourses,
      differentCourses: differentCourses,
      mostSellingCourses: mostSellingCourses,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
