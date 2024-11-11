/**
 * Response Transformer
 * Transforms data before sending in response
 */

class ResponseTransformer {
  /**
   * Transform user data
   * @param {Object} user - User object
   * @returns {Object} Transformed user data
   */
  static transformUser(user) {
    if (!user) return null;

    return {
      id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role,
      isVerified: Boolean(user.is_verified),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      // Exclude sensitive fields
      ...(user.phone && { phone: user.phone })
    };
  }

  /**
   * Transform property data
   * @param {Object} property - Property object
   * @returns {Object} Transformed property data
   */
  static transformProperty(property) {
    if (!property) return null;

    return {
      id: property.property_id,
      title: property.title,
      description: property.description,
      address: typeof property.address === 'string' 
        ? JSON.parse(property.address) 
        : property.address,
      price: parseFloat(property.price),
      status: property.status,
      amenities: typeof property.amenities === 'string'
        ? JSON.parse(property.amenities)
        : property.amenities,
      createdAt: property.created_at,
      updatedAt: property.updated_at
    };
  }

  /**
   * Transform maintenance request data
   * @param {Object} request - Maintenance request object
   * @returns {Object} Transformed request data
   */
  static transformMaintenanceRequest(request) {
    if (!request) return null;

    return {
      id: request.request_id,
      propertyId: request.property_id,
      userId: request.user_id,
      issue: request.issue,
      description: request.description,
      priority: request.priority,
      status: request.status,
      scheduledDate: request.scheduled_date,
      completedDate: request.completed_date,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
      ...(request.comments && {
        comments: request.comments.map(this.transformComment)
      })
    };
  }

  /**
   * Transform comment data
   * @param {Object} comment - Comment object
   * @returns {Object} Transformed comment data
   */
  static transformComment(comment) {
    if (!comment) return null;

    return {
      id: comment.comment_id,
      userId: comment.user_id,
      content: comment.comment,
      createdAt: comment.created_at,
      ...(comment.user && { user: this.transformUser(comment.user) })
    };
  }

  /**
   * Transform collection of items
   * @param {Array} items - Array of items
   * @param {Function} transformer - Transformer function
   * @returns {Array} Transformed items
   */
  static transformCollection(items, transformer) {
    if (!Array.isArray(items)) return [];
    return items.map(item => transformer(item));
  }
}

module.exports = ResponseTransformer;
