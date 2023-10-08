// //Hamburger and mobile menu
// function toggleMenu(flag) {
//   let value = document.getElementById("menu");
//   if (flag) {
//     value.classList.remove("hidden");
//   } else {
//     value.classList.add("hidden");
//   }
// }
// function animate(elem, style, unit, from, to, time, prop) {
//   if (!elem) {
//     return;
//   }
//   var start = new Date().getTime(),
//     timer = setInterval(function () {
//       var step = Math.min(1, (new Date().getTime() - start) / time);
//       if (prop) {
//         elem[style] = from + step * (to - from) + unit;
//       } else {
//         elem.style[style] = from + step * (to - from) + unit;
//       }
//       if (step === 1) {
//         clearInterval(timer);
//       }
//     }, 25);
//   if (prop) {
//     elem[style] = from + unit;
//   } else {
//     elem.style[style] = from + unit;
//   }
// }

// document.getElementById("goDown").onclick = function () {
//   var target = document.getElementById("products");
//   animate(
//     document.scrollingElement || document.documentElement,
//     "scrollTop",
//     "",
//     0,
//     target.offsetTop,
//     2000,
//     true
//   );
// };

// Loading texts
const experiencesContainer = document.getElementById("experiencesContainer");

fetch("assets/content.json")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Couldn't load webpage content"); // TODO: handle properly
    }
    return response.json(); // Parse the response as JSON
  })
  .then((jsonData) => {
    console.log(jsonData);

    const experiencesContent = jsonData.experiences;
    experiencesContent.forEach((c, _) => {
      const exp = document.createElement("div");
      exp.className =
        "flex flex-col sm:flex-row items-stretch mb-8 sm:mb-16 container mx-auto";

      const exp_img_container = document.createElement("div");
      exp_img_container.className = "w-full sm:w-1/3 relative h- sm:h-auto";
      exp.appendChild(exp_img_container);

      const exp_img = document.createElement("img");
      exp_img.className =
        "w-full object-cover absolute inset-0 object-center h-full";
      exp_img.src = c.photo_src;
      exp_img.alt = c.photo_alt;
      exp_img.setAttribute("loading", "lazy");
      exp_img_container.appendChild(exp_img);

      const exp_right_container = document.createElement("div");
      exp_right_container.className =
        "container mx-auto w-full sm:w-2/3 py-10 sm:py-16 lg:py-20 px-6 sm:px-12 lg:px-16 bg-gray-100";
      exp.appendChild(exp_right_container);

      const exp_header = document.createElement("h3");
      exp_header.className =
        "text-gray-800 text-2xl mb-3 leading-normal tracking-normal font-bold";
      exp_header.innerHTML = `${c.name}`;
      exp_right_container.appendChild(exp_header);

      // TODO: move this to be inline with header
      const exp_dates = document.createElement("p");
      exp_dates.className =
        "text-gray-600 mb-3 leading-normal tracking-normal italic";
      exp_dates.innerHTML = `${c.dates}`;
      exp_right_container.appendChild(exp_dates);

      const exp_p = document.createElement("p");
      exp_p.className = "text-gray-600 leading-6 font-normal tracking-normal";
      exp_p.innerHTML = `${c.description}`;
      exp_right_container.appendChild(exp_p);

      // Append the div element to the container
      experiencesContainer.appendChild(exp);
    });
    // TODO: add a "more" button
    // TODO: add ability to link stuff
  })
  .catch((error) => {
    console.error("There was a problem fetching the JSON data:", error);
  });
