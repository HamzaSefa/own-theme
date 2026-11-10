import { Link, Navigate, useParams } from "react-router-dom";
import { courses, isPublicCourse } from "../data/courses";
import { bundlePrice, prices } from "../data/admin";

export default function Checkout() {
  const { courseId } = useParams();
  const isBundle = courseId === "bundle";
  const course = isBundle
    ? { id: "bundle", title: "Complete Bundle" }
    : courses.find((item) => item.id === courseId && isPublicCourse(item));

  if (courseId && !course) return <Navigate to="/courses" replace />;
  const publicCourses = courses.filter(isPublicCourse);
  if (isBundle && (courses.length !== 3 || publicCourses.length !== 3)) return <Navigate to="/plans" replace />;
  if (course?.purchaseOption === "Subscription included") return <Navigate to="/plans" replace />;
  if (!courseId) {
    return (
      <main className="container public-page account-support-page">
        <header className="public-page-intro">
          <span className="eyebrow">CHECKOUT</span>
          <h1>Choose what you want to review.</h1>
          <p>Review an individual one-time course purchase or the complete one-time bundle. Payment processing is unavailable in this preview.</p>
        </header>
        <div className="plans-individual-grid">
          {publicCourses.map((item) => (
            <article className="plans-course-card" key={item.id}>
              <span className="eyebrow">{item.tag}</span>
              <h2>{item.title}</h2>
              <div className="plans-course-price">{item.price !== "" && item.price != null ? `$${item.price}` : prices[item.id] != null ? `$${prices[item.id]}` : "Price not set"}<small> one-time</small></div>
              <Link to={`/checkout/${item.id}`} className="text-link">Review course <span aria-hidden="true">↗</span></Link>
            </article>
          ))}
          <article className="plans-course-card">
            <span className="eyebrow">COMPLETE BUNDLE</span>
            <h2>All three courses</h2>
            <div className="plans-course-price">${bundlePrice}<small> one-time</small></div>
            <Link to="/checkout/bundle" className="text-link">Review bundle <span aria-hidden="true">↗</span></Link>
          </article>
        </div>
      </main>
    );
  }

  const price = isBundle
    ? bundlePrice
    : course.price !== "" && course.price != null
      ? course.price
      : prices[course.id];
  const includedCourses = isBundle ? publicCourses : [course];

  return (
    <main className="container checkout-page">
      <header className="public-page-intro">
        <span className="eyebrow">ORDER REVIEW · DEMO ONLY</span>
        <h1>Review your selection.</h1>
        <p>This page displays the selected item and price, but checkout is not connected to a payment provider.</p>
      </header>
      <div className="checkout">
        <section className="panel checkout-unavailable">
          <span className="eyebrow">PAYMENT NOT AVAILABLE</span>
          <h2>No payment has been attempted.</h2>
          <p>The website has no payment backend connected. It cannot charge you, create a verified order, or confirm enrollment.</p>
          <button type="button" className="btn btn-primary btn-block" disabled>
            {price == null || price === "" ? "Price not set" : "Checkout unavailable"}
          </button>
          <Link to="/checkout/status" className="text-link">Check order status <span aria-hidden="true">↗</span></Link>
        </section>
        <section className="panel checkout-summary">
          <h2>Order summary</h2>
          {includedCourses.map((item) => (
            <div className="sum-row" key={item.id}><span>{item.title}</span><span>{isBundle ? "Included" : `$${price}`}</span></div>
          ))}
          <div className="sum-row total"><span>{isBundle ? "Bundle total · one-time" : "Course total · one-time"}</span><span>{price != null && price !== "" ? `$${price}` : "Not set"}</span></div>
          <p className="demo-note">This is an order preview only. No recurring subscription is included.</p>
          <Link to={isBundle ? "/plans" : `/courses/${course.id}`} className="text-link">Back to {isBundle ? "plans" : "course details"} <span aria-hidden="true">↗</span></Link>
        </section>
      </div>
    </main>
  );
}
